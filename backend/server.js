const express = require("express");
const cors = require("cors");
const db = require("./db.js"); // Import database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // For file uploads
// Remove pdf-parse, we'll use Gemini
// const pdfParse = require('pdf-parse'); 
// Import Google AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3001;
const saltRounds = 10; // For bcrypt
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this'; // Use environment variable in production!

// --- Multer Configuration (Memory Storage) ---
const storage = multer.memoryStorage(); // Store file in memory for processing
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
    fileFilter: (req, file, cb) => { // Basic filter for PDFs
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// --- Middleware ---
// Configure CORS
const allowedOrigins = [
  'http://localhost:8080', // Your Vite dev server
  'https://67f1748667495d47aff970e8--rad-llama-90904c.netlify.app' // Ensure this matches EXACTLY
];

const corsOptions = {
  origin: function (origin, callback) {
    // Log the origin header received by the server
    console.log(`CORS Check: Received origin: ${origin}`); 
    
    // Trim the received origin just in case
    const trimmedOrigin = origin ? origin.trim() : undefined;

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!trimmedOrigin) return callback(null, true);
    // Allow all origins in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
    }    
    // Allow specified origins in production
    // Use trimmedOrigin for the check
    if (allowedOrigins.indexOf(trimmedOrigin) !== -1) {
      callback(null, true)
    } else {
      console.error(`CORS Error: Origin "${trimmedOrigin}" not in allowed list:`, allowedOrigins); // Log the error case too
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json()); 

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Add user payload to request object
    next();
  });
};

// --- Admin Authorization Middleware ---
const authorizeAdmin = (req, res, next) => {
  const userId = req.user.id; // Assumes authenticateToken ran first

  const sql = "SELECT role FROM users WHERE id = ?";
  db.get(sql, [userId], (err, user) => {
    if (err) {
        console.error("DB Select error (admin check):", err);
        return res.status(500).json({ "error": "Error checking user role" });
    }
    // Check if user exists and has the 'admin' role
    if (user && user.role === 'admin') {
        next(); // User is admin, proceed to the route handler
    } else {
        res.status(403).json({ "error": "Forbidden: Requires admin privileges" }); // Not an admin
    }
  });
};

// --- Routes ---
// Simple test route to check if the backend is running
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// --- Auth Routes ---
app.post("/api/auth/signup", (req, res) => {
  console.log("--- Received request at /api/auth/signup ---");
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ "error": "Email and password are required" });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error("Hashing error:", err);
        return res.status(500).json({ "error": "Error creating user" });
    }

    const insert = 'INSERT INTO users (email, password) VALUES (?,?)';
    db.run(insert, [email, hash], function (err) {
        if (err) {
            // Check for unique constraint violation (email already exists)
            if (err.message.includes('UNIQUE constraint failed: users.email')) {
                return res.status(409).json({ "error": "Email already exists" });
            }
            console.error("DB Insert error:", err);
            return res.status(500).json({ "error": "Error creating user" });
        }
        // Return newly created user id (optional)
        res.status(201).json({ "message": "User created successfully", "userId": this.lastID });
    });
  });
});

app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ "error": "Email and password are required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err) {
            console.error("DB Select error:", err);
            return res.status(500).json({ "error": "Login failed" });
        }
        if (!user) {
            return res.status(401).json({ "error": "Invalid email or password" });
        }

        // Compare submitted password with stored hash
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error("Compare error:", err);
                return res.status(500).json({ "error": "Login failed" });
            }
            if (result) {
                // Passwords match! Generate JWT
                const userPayload = { id: user.id, email: user.email }; // Payload for JWT
                const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

                res.json({
                    message: "Login successful",
                    accessToken: accessToken,
                    user: { // Send back non-sensitive user info
                        id: user.id,
                        email: user.email,
                        onboarding_completed: user.onboarding_completed
                    }
                });
            } else {
                // Passwords don't match
                res.status(401).json({ "error": "Invalid email or password" });
            }
        });
    });
});

// --- Protected User Route Example ---
app.get("/api/user/profile", authenticateToken, (req, res) => {
    // req.user contains the payload from the verified JWT (e.g., { id: user.id, email: user.email })
    const userId = req.user.id;

    const sql = "SELECT id, email, onboarding_completed, created_at FROM users WHERE id = ?";
    db.get(sql, [userId], (err, user) => {
        if (err) {
            console.error("DB Select error (profile):", err);
            return res.status(500).json({ "error": "Failed to fetch profile" });
        }
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        res.json({ user });
    });
});

// --- Route to UPDATE user profile (e.g., onboarding status) ---
app.patch("/api/user/profile", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { onboarding_completed } = req.body;

    // Basic validation: Check if onboarding_completed is a boolean
    if (typeof onboarding_completed !== 'boolean') {
        return res.status(400).json({ error: "Invalid value for onboarding_completed. Must be true or false." });
    }

    const sql = 'UPDATE users SET onboarding_completed = ? WHERE id = ?';
    db.run(sql, [onboarding_completed, userId], function(err) {
        if (err) {
            console.error("DB Update error (profile):", err);
            return res.status(500).json({ error: "Failed to update profile" });
        }
        if (this.changes === 0) {
            // Although authenticateToken should prevent this, double-check user exists
            return res.status(404).json({ error: "User not found to update" });
        }
        console.log(`User profile updated for ID: ${userId}, onboarding: ${onboarding_completed}`);
        // Optionally return the updated user data
        // For simplicity, just return success message
        res.json({ message: "Profile updated successfully" });
    });
});

// --- Tax Calculation Route (Unprotected for now) ---
// TODO: Decide if this needs authentication. Probably yes.
app.post("/api/calculate-tax", (req, res) => {
  const inputData = req.body;
  console.log("Received data for tax calculation:", inputData);

  // --- Placeholder Logic --- 
  // TODO: Replace this with actual Indian tax calculation logic 
  // based on inputData (salary components, deductions, regime choice etc.)
  const grossTotalIncome = Number(inputData.basic || 0) + Number(inputData.hra || 0) + Number(inputData.special || 0) + Number(inputData.otherIncome || 0); // Example calculation
  // Sum up relevant 80C deductions (ensure they are numbers)
  const deduction80C = [
      inputData.deduction80C_epf,
      inputData.deduction80C_elss,
      inputData.deduction80C_insurance,
      inputData.deduction80C_ppf,
      inputData.deduction80C_tuition,
      inputData.deduction80C_housingLoanPrincipal
  ].reduce((sum, val) => sum + Number(val || 0), 0);
  // TODO: Add proper calculation for other deductions (80D, 80CCD1B, 80TTA, HRA Exemption, Home Loan Interest)
  const totalDeductions = Math.min(deduction80C, 150000) + Number(inputData.deduction80D_selfFamily || 0) + Number(inputData.deduction80D_parents || 0) + Number(inputData.deduction80CCD1B_nps || 0) + Number(inputData.deduction80TTA_savingsInterest || 0) + Number(inputData.homeLoanInterest || 0); // Highly simplified

  const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions - 50000); // Example with Standard Deduction (Old Regime style)

  // Very basic placeholder tax calculation (DO NOT USE FOR REAL TAXES)
  let taxPayable = 0;
  if (taxableIncome > 250000) { // Simplified old regime slab
      taxPayable = (taxableIncome - 250000) * 0.05; 
  }
  // --- End Placeholder Logic ---

  // Send back calculated details (or placeholder data)
  res.json({ 
    message: "Tax calculation request received.", 
    receivedData: inputData, 
    // Replace with actual calculated values
    calculatedTaxDetails: {
        grossTotalIncome: grossTotalIncome,
        totalDeductions: totalDeductions,
        taxableIncome: taxableIncome,
        taxPayable: taxPayable, // Replace with actual calculated tax
        // TODO: Add comparison for old vs new regime here eventually
    } 
  });
});

// --- Helper to get API Key from DB --- 
async function getGeminiApiKey() {
    return new Promise((resolve, reject) => {
        const sql = "SELECT value FROM settings WHERE key = ?";
        db.get(sql, ['geminiApiKey'], (err, row) => {
            if (err) {
                console.error("Error fetching API key:", err);
                reject("Database error fetching API key.");
            } else if (row && row.value) {
                resolve(row.value);
            } else {
                resolve(null); // Key not found or not set
            }
        });
    });
}

// --- Endpoint to GET User Documents ---
app.get("/api/documents", authenticateToken, (req, res) => {
    const userId = req.user.id;
    console.log(`Fetching documents for user ID: ${userId}`);

    const sql = `
        SELECT id, user_id, original_filename, upload_timestamp, identified_type, parsed_data_json 
        FROM user_documents 
        WHERE user_id = ? 
        ORDER BY upload_timestamp DESC
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("DB Error fetching documents:", err);
            return res.status(500).json({ error: "Failed to retrieve documents." });
        }
        // Attempt to parse the JSON data for each row
        const documents = rows.map(row => {
            try {
                return { ...row, parsed_data: JSON.parse(row.parsed_data_json || 'null') };
            } catch (parseError) {
                console.error(`Failed to parse JSON for doc ID ${row.id}:`, parseError);
                return { ...row, parsed_data: null, parseError: 'Failed to parse stored JSON' };
            }
        });
        
        res.json({ documents });
    });
});

// --- Document Upload Endpoint (Updated for Gemini) ---
app.post("/api/documents/upload", authenticateToken, upload.single('document'), async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated token
    const file = req.file;
    console.log(`Received upload request for user ID: ${userId}, filename: ${file?.originalname}`);

    if (!file) {
        return res.status(400).json({ error: "No file uploaded or file type not allowed." });
    }

    let apiKey;
    try {
        apiKey = await getGeminiApiKey();
        if (!apiKey) {
            return res.status(500).json({ error: "Gemini API Key not configured in admin settings." });
        }
    } catch (dbError) {
        return res.status(500).json({ error: "Failed to retrieve API key from database." });
    }

    try {
        // Initialize Google AI Client
        const genAI = new GoogleGenerativeAI(apiKey);
        // Model selection (use a model that supports inline data like PDF/images)
        // gemini-1.5-flash-latest is a good starting point
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // Convert PDF buffer to base64 for Gemini
        const pdfBuffer = file.buffer;
        const pdfBase64 = pdfBuffer.toString('base64');

        // Define the part for Gemini API
        const filePart = {
            inlineData: {
              mimeType: file.mimetype, // Should be 'application/pdf'
              data: pdfBase64
            },
        };

        // Construct the prompt
        const prompt = `Analyze the provided salary slip PDF (assume it's a monthly slip unless specified otherwise, like in Form 16). Extract the following details as accurately as possible and provide the result STRICTLY as a JSON object with ONLY these keys (use null if a value is not found or cannot be determined):

        - financialYear (e.g., "2023-24", determine from document if possible)
        - assessmentYear (e.g., "2024-25", determine from document if possible)
        - basic (Basic Salary / Basic Pay, monthly amount)
        - hra (House Rent Allowance, monthly amount)
        - specialAllowance (Special Allowance, monthly amount)
        - lta (Leave Travel Allowance, if mentioned monthly/annually - specify if annual)
        - otherAllowances (Sum of any other taxable allowances, monthly amount)
        - employerPf (Employer's Provident Fund contribution, monthly amount, if specified separately from employee's)
        - employeePf (Employee's Provident Fund / PF Contribution, monthly amount)
        - professionalTax (Professional Tax / PT, monthly amount)
        - tds (Tax Deducted at Source, monthly amount)
        - grossEarnings (Total Gross Earnings / Gross Pay, monthly amount)
        - totalDeductions (Total Deductions from salary slip, monthly amount)
        - netSalary (Net Salary / Net Pay / Take Home Pay, monthly amount)
        
        Return ONLY the JSON object, without any introductory text, backticks, or explanations.
        Example:
        { "financialYear": "2023-24", "assessmentYear": "2024-25", "basic": 50000, "hra": 20000, "specialAllowance": 10000, "lta": null, "otherAllowances": 5000, "employerPf": 1800, "employeePf": 1800, "professionalTax": 200, "tds": 5000, "grossEarnings": 85000, "totalDeductions": 7000, "netSalary": 78000 }`;

        console.log(`Sending PDF (${file.originalname}) to Gemini for analysis...`);
        // Generate content
        const result = await model.generateContent([prompt, filePart]);
        const response = result.response;
        const responseText = response.text();

        console.log("Gemini Raw Response Text:", responseText);

        let parsedData = { fileName: file.originalname }; // Start with filename
        let aiJson = null;
        try {
            // Extract JSON string from potential markdown code blocks
            let jsonString = responseText;
            const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
                console.log("Extracted JSON string from markdown block.");
                jsonString = match[1];
            }
            
            // Attempt to parse the extracted (or original) string as JSON
            aiJson = JSON.parse(jsonString);
            
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", parseError);
            // Send back an error or maybe the raw text for debugging
            return res.status(500).json({ 
                error: "AI analysis completed, but failed to parse the result into the expected JSON format.",
                rawAIResponse: responseText // Include raw response for debugging
            });
        }

        // If parsing was successful, merge AI results, calculate annuals, then calculate tax
        if(aiJson) {
            // Start with Gemini's results
            let tempParsedData = { ...aiJson }; 

            // --- Calculate Annual Figures --- 
            let estimatedAnnualGross = null;
            if (tempParsedData.grossEarnings && typeof tempParsedData.grossEarnings === 'number') {
                estimatedAnnualGross = tempParsedData.grossEarnings * 12;
            } else {
                // Fallback: Sum components if gross is missing
                const annualBasic = (tempParsedData.basic || 0) * 12;
                const annualHra = (tempParsedData.hra || 0) * 12;
                const annualSpecial = (tempParsedData.specialAllowance || 0) * 12;
                const annualOther = (tempParsedData.otherAllowances || 0) * 12;
                if (annualBasic > 0) { // Only use fallback if basic is present
                     estimatedAnnualGross = annualBasic + annualHra + annualSpecial + annualOther;
                     console.log("Used fallback calculation for Annual Gross");
                }
            }
            const annualEmployeePf = (tempParsedData.employeePf || 0) * 12;
            const annualPt = (tempParsedData.professionalTax || 0) * 12;
            const estimatedAnnualTds = (tempParsedData.tds || 0) * 12;
            // --- End Calculate Annual Figures --- 

            // Add calculated annual figures needed for tax calculation
            tempParsedData.estimatedAnnualGross = estimatedAnnualGross;
            tempParsedData.annualEmployeePf = annualEmployeePf;
            tempParsedData.annualPt = annualPt;

            // Calculate estimated tax liability using the processed data
            const taxDetails = calculateTaxLiability(tempParsedData);
            
            // Combine original AI data, calculated annuals, and tax details for the final result
            parsedData = { 
                fileName: file.originalname, 
                ...aiJson, // Original parsed monthly/other data
                estimatedAnnualGross: estimatedAnnualGross, // Ensure this is the final one used
                estimatedAnnualEmployeePf: annualEmployeePf, // Standardized name
                estimatedAnnualTds: estimatedAnnualTds,
                ...taxDetails // Tax calculation results
            };

        }

        console.log("Final Parsed Data with Tax:", parsedData);

        // --- Save Document Info to Database ---
        try {
            const userId = req.user.id; // Get user ID from authenticated token
            const originalFilename = file.originalname;
            const parsedDataJson = JSON.stringify(parsedData); // Store the whole result

            // Basic document type identification (can be improved)
            let identifiedType = 'other';
            if (originalFilename.toLowerCase().includes('salary') || originalFilename.toLowerCase().includes('payslip')) {
                identifiedType = 'salary_slip';
            } else if (originalFilename.toLowerCase().includes('form 16') || originalFilename.toLowerCase().includes('form16')) {
                identifiedType = 'form_16';
            }
            // TODO: Could ask Gemini to identify the document type as well

            const insertSql = `INSERT INTO user_documents (user_id, original_filename, identified_type, parsed_data_json) VALUES (?, ?, ?, ?)`;
            db.run(insertSql, [userId, originalFilename, identifiedType, parsedDataJson], function(err) {
                if (err) {
                    console.error("DB Error saving document info:", err);
                    // Decide if we should still return success to user if AI processing worked but DB failed
                    // For now, let's still return success but log the DB error
                     res.status(200).json({ // Return 200 OK but maybe add a warning
                        message: "File processed by AI successfully, but failed to save document record to database.",
                        warning: "Document record not saved.",
                        originalName: file.originalname,
                        parsedData: parsedData, 
                    });
                } else {
                    console.log(`Document record saved successfully for user ${userId}, doc ID: ${this.lastID}`);
                     // Proceed with the original success response if DB save worked
                    res.json({ 
                        message: "File processed by AI and record saved successfully.",
                        originalName: file.originalname,
                        parsedData: parsedData, // Send the AI-parsed data
                    });
                }
            });
        } catch (dbSaveError) {
             console.error("Error preparing to save document info:", dbSaveError);
             // Fallback response if DB logic itself fails critically
             res.status(500).json({ 
                message: "File processed by AI, but encountered an error saving document record.",
                error: "Database operation failed.",
                originalName: file.originalname,
                parsedData: parsedData, 
            });
        }

    } catch (error) {
        console.error("Error during Gemini processing or file handling:", error);
        res.status(500).json({ error: "Failed to process file with AI.", details: error.message });
    }
});

// --- Tax Calculation Logic --- 
// Updated to accept pre-calculated annual figures
function calculateTaxLiability(processedData) {
    // Use pre-calculated annual figures passed in processedData
    const annualGross = processedData.estimatedAnnualGross || 0;
    const annualEmployeePf = processedData.annualEmployeePf || 0;
    const annualPt = processedData.annualPt || 0;

    // --- Deductions (Simplified) --- 
    const deduction80C = Math.min(annualEmployeePf, 150000); // Example: Only PF counted for 80C
    const standardDeductionOld = 50000;
    const standardDeductionNew = 50000;

    let taxableIncomeOld = 0;
    let taxOld = 0;
    let taxableIncomeNew = 0;
    let taxNew = 0;
    const cessRate = 0.04;

    // --- Old Regime Calculation (Simplified FY 2023-24) --- 
    // Use deductions available under Old Regime
    taxableIncomeOld = Math.max(0, annualGross - standardDeductionOld - deduction80C - annualPt);
    if (taxableIncomeOld <= 250000) {
        taxOld = 0;
    } else if (taxableIncomeOld <= 500000) {
        taxOld = (taxableIncomeOld - 250000) * 0.05;
    } else if (taxableIncomeOld <= 1000000) {
        taxOld = 12500 + (taxableIncomeOld - 500000) * 0.20;
    } else {
        taxOld = 112500 + (taxableIncomeOld - 1000000) * 0.30;
    }
    // Check rebate u/s 87A (if taxable income <= 5L)
    if (taxableIncomeOld <= 500000) {
       taxOld = 0; 
    }
    const totalTaxOld = taxOld > 0 ? taxOld * (1 + cessRate) : 0;

    // --- New Regime Calculation (Default, Simplified FY 2023-24) --- 
    // Only Standard Deduction applicable by default in New Regime
    taxableIncomeNew = Math.max(0, annualGross - standardDeductionNew); 
    if (taxableIncomeNew <= 300000) {
        taxNew = 0;
    } else if (taxableIncomeNew <= 600000) {
        taxNew = (taxableIncomeNew - 300000) * 0.05;
    } else if (taxableIncomeNew <= 900000) {
        taxNew = 15000 + (taxableIncomeNew - 600000) * 0.10;
    } else if (taxableIncomeNew <= 1200000) {
        taxNew = 45000 + (taxableIncomeNew - 900000) * 0.15;
    } else if (taxableIncomeNew <= 1500000) {
        taxNew = 90000 + (taxableIncomeNew - 1200000) * 0.20;
    } else {
        taxNew = 150000 + (taxableIncomeNew - 1500000) * 0.30;
    }
    // Check rebate u/s 87A (if taxable income <= 7L)
    if (taxableIncomeNew <= 700000) {
       taxNew = 0; 
    }
    const totalTaxNew = taxNew > 0 ? taxNew * (1 + cessRate) : 0;

    // Determine recommendation
    const savings = totalTaxOld - totalTaxNew;
    const recommendedRegime = totalTaxNew <= totalTaxOld ? 'new' : 'old';

    // Return only tax-specific results, annual gross is already in main parsedData
    return {
        taxableIncomeOld: Math.round(taxableIncomeOld),
        taxOldRegime: Math.round(totalTaxOld),
        taxableIncomeNew: Math.round(taxableIncomeNew),
        taxNewRegime: Math.round(totalTaxNew),
        taxSavings: Math.round(savings), // Positive value means New regime saves tax
        recommendedRegime: recommendedRegime,
    };
}

// --- Admin Routes ---
// TODO: Secure properly
app.get("/api/admin/settings", authenticateToken, authorizeAdmin, (req, res) => {
  console.log("Accessing protected admin settings...");
  // Fetch sensitive settings only accessible to admins
  const sql = "SELECT key, value FROM settings";
  db.all(sql, [], (err, rows) => {
      if (err) {
          console.error("Error fetching settings:", err);
          return res.status(500).json({ error: "Failed to fetch settings" });
      }
      // Convert array of {key, value} to a single object {key1: value1, key2: value2}
      const settings = rows.reduce((acc, row) => {
          acc[row.key] = row.value;
          return acc;
      }, {});
      res.json({ settings });
  });
});

app.post("/api/admin/settings", authenticateToken, authorizeAdmin, (req, res) => {
    console.log("Updating protected admin settings...");
    const settingsToUpdate = req.body.settings; // Expecting { geminiApiKey: '...', otherKey: '...' }

    if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null) {
        return res.status(400).json({ error: "Invalid settings format. Expected an object." });
    }

    // Use transactions for multiple updates
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        let hadError = false;
        const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
        
        Object.entries(settingsToUpdate).forEach(([key, value]) => {
            // Basic validation or sanitization could go here
            db.run(sql, [key, value], function(err) {
                if (err) {
                    console.error(`Error updating setting ${key}:`, err);
                    hadError = true;
                }
            });
        });

        if (hadError) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Failed to update some settings." });
        }
        
        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Commit error:", err);
                return res.status(500).json({ error: "Failed to commit settings update." });
            }
            res.json({ message: "Settings updated successfully." });
        });
    });
});

// --- Endpoint to GET Dashboard Summary (Latest Doc Data) ---
app.get("/api/dashboard-summary", authenticateToken, (req, res) => {
    const userId = req.user.id;
    console.log(`Fetching dashboard summary for user ID: ${userId}`);

    // Query for the most recent document for this user
    const sql = `
        SELECT parsed_data_json 
        FROM user_documents 
        WHERE user_id = ? 
        ORDER BY upload_timestamp DESC 
        LIMIT 1
    `;

    db.get(sql, [userId], (err, row) => {
        if (err) {
            console.error("DB Error fetching latest document:", err);
            return res.status(500).json({ error: "Failed to retrieve latest document data." });
        }
        
        if (!row || !row.parsed_data_json) {
            // No documents found for the user, return empty/null data
            console.log(`No documents found for user ID: ${userId} for dashboard summary.`);
            return res.json({ summary: null }); 
        }

        try {
            const parsedData = JSON.parse(row.parsed_data_json);
            // Extract only the fields needed for the dashboard summary
            const summary = {
                estimatedAnnualGross: parsedData.estimatedAnnualGross ?? null,
                estimatedTaxOldRegime: parsedData.taxOldRegime ?? null,
                estimatedTaxNewRegime: parsedData.taxNewRegime ?? null,
                estimatedTaxSavings: parsedData.taxSavings ?? null,
                recommendedRegime: parsedData.recommendedRegime ?? null,
                financialYear: parsedData.financialYear ?? null,
                latestParsedSalaryData: parsedData // Include the full data for the modal
            };
            res.json({ summary });
        } catch (parseError) {
            console.error(`Failed to parse JSON for latest doc for user ${userId}:`, parseError);
            return res.status(500).json({ error: "Failed to process latest document data." });
        }
    });
});

// --- Endpoint to DELETE User Document ---
app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
   // ... route logic ...
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 