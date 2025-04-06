require('dotenv').config(); // Load environment variables from .env file

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
  'http://localhost:8080', // Keep for local dev
  'https://taxgenny.netlify.app' // Add your actual deployed Netlify URL
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS Check: Received origin: ${origin}`); 
    const trimmedOrigin = origin ? origin.trim() : undefined;
    if (!trimmedOrigin) return callback(null, true);
    // Simplified check: Allow if origin is in the list OR if it's a Netlify preview deploy
    const isNetlifyPreview = trimmedOrigin.includes('.netlify.app') && trimmedOrigin.includes('deploy-preview');
    const isAllowed = allowedOrigins.some(allowed => trimmedOrigin === allowed) || isNetlifyPreview;

    if (isAllowed) {
        callback(null, true)
    } else {
        console.error(`CORS Error: Origin "${trimmedOrigin}" not in allowed list:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200
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

// --- Document Parsing Route ---
// Remove authenticateToken middleware to allow unauthenticated uploads
app.post("/api/parse-income-document", upload.single('file'), async (req, res) => {
    console.log("--- Received request at /api/parse-income-document (UNAUTHENTICATED) ---");
    // Remove user ID reference as user is not authenticated
    // const userId = req.user.id; 

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    try {
        // --- Gemini API Interaction Logic Goes Here --- 
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             console.error("GEMINI_API_KEY not configured!");
             return res.status(500).json({ error: "Server configuration error for document parsing." });
        }
        
        // Check if file buffer exists
        if (!req.file.buffer) {
            console.error("File buffer is missing.");
            return res.status(400).json({ error: "Uploaded file data is corrupted or missing." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Make sure to use a model compatible with your file type (e.g., gemini-pro-vision for images/PDFs)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 

        const imagePart = {
             inlineData: {
                 data: req.file.buffer.toString("base64"),
                 mimeType: req.file.mimetype // e.g., 'application/pdf'
             },
         };

         const prompt = `
            Parse the following document (${req.file.originalname}) and extract these specific fields in JSON format:
            - basic (Basic Salary/Pay)
            - hra (House Rent Allowance)
            - special (Special Allowance)
            - lta (Leave Travel Allowance)
            - otherIncome (Any other income like interest, etc. if clearly stated)
            - epfContribution (Employee's Provident Fund contribution)
            - professionalTax (Professional Tax deducted)

            If a field is not found, return it as null or omit it. Provide only the raw JSON object without any markdown formatting like \`\`\`json or \`\`\`
            Example: {"basic": 600000, "hra": 300000, "epfContribution": 72000}
        `;
        
        console.log(`Sending ${req.file.mimetype} to Gemini for parsing...`);
        const result = await model.generateContent([prompt, imagePart]);
        // Error handling for safety checks from Gemini
        if (!result.response) {
            console.error("Gemini API Error: No response generated.", result); // Log the full result for debugging
            // Potentially inspect result.blockReason or result.finishReason if available
            return res.status(500).json({ error: "Failed to get response from analysis service." });
        }
        
        const response = result.response;
        const text = response.text(); // Use text() method as per SDK
        console.log("Received Gemini Response Text:", text);

        let parsedData = {};
        try {
             // Attempt to directly parse, assuming Gemini follows the prompt correctly
             parsedData = JSON.parse(text); 
             console.log("Successfully Parsed JSON from Gemini:", parsedData);
        } catch (parseError) {
            console.error("Failed to parse JSON directly from Gemini response:", parseError);
            console.error("Original Gemini Text was:", text); 
            // Optionally try cleaning markdown (though prompt requests raw JSON)
             const cleanedText = text.replace(/```json\\n?|\\n?```/g, "").trim();
             try {
                 parsedData = JSON.parse(cleanedText);
                 console.log("Successfully Parsed JSON after cleaning:", parsedData);
             } catch (cleanedParseError) {
                 console.error("Failed to parse JSON even after cleaning:", cleanedParseError);
                return res.status(500).json({ error: "Failed to understand document structure after analysis." });
             }
        }

        // --- (Optional) Store results in database ---
        // ... (consider adding DB storage logic here) ...

        res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error during document parsing pipeline:", error);
        // Check for specific Gemini API errors if possible
        // if (error.message.includes("API key not valid")) { ... }
        res.status(500).json({ error: "Failed to process document.", details: error.message });
    }
});

// --- Helper Functions for Tax Calculation (FY 2024-25 / AY 2025-26) ---

function calculateHraExemption(basic, hraReceived, rentPaid, isMetroCity) {
    if (!hraReceived || hraReceived <= 0 || !rentPaid || rentPaid <= 0 || !basic || basic <= 0) {
        return 0;
    }
    // 1. Actual HRA Received
    const actualHra = hraReceived;
    // 2. Rent Paid minus 10% of Basic Salary
    const rentMinus10PercentBasic = Math.max(0, rentPaid - (0.10 * basic));
    // 3. 50% of Basic Salary (Metro) or 40% (Non-Metro)
    const percentageOfBasic = isMetroCity ? (0.50 * basic) : (0.40 * basic);

    const exemption = Math.min(actualHra, rentMinus10PercentBasic, percentageOfBasic);
    return Math.max(0, exemption); // Ensure exemption is not negative
}

// Calculates tax based on taxable income and slab rates
function calculateTaxSlab(taxableIncome, slabs) {
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (let i = slabs.length - 1; i >= 0; i--) {
        const slab = slabs[i];
        if (remainingIncome > slab.limit) {
            tax += (remainingIncome - slab.limit) * slab.rate;
            remainingIncome = slab.limit;
        }
    }
    return tax;
}

const cessRate = 0.04;

// --- Helper Function to Get Tax Rules by AY --- 
function getTaxRules(assessmentYear) {
    // Default to latest AY if invalid/missing
    const ay = assessmentYear === "2024-25" ? "2024-25" : "2025-26"; 
    
    console.log(`Using tax rules for Assessment Year: ${ay}`);

    if (ay === "2024-25") { // Rules for FY 2023-24
        return {
            oldRegimeSlabs: [
                { limit: 0, rate: 0 },
                { limit: 250000, rate: 0.05 },
                { limit: 500000, rate: 0.20 },
                { limit: 1000000, rate: 0.30 },
            ],
            newRegimeSlabs: [ // Default New Regime slabs for FY 23-24
                { limit: 0, rate: 0 },
                { limit: 300000, rate: 0.05 },
                { limit: 600000, rate: 0.10 },
                { limit: 900000, rate: 0.15 },
                { limit: 1200000, rate: 0.20 },
                { limit: 1500000, rate: 0.30 },
            ],
            oldRegimeRebateLimit: 500000,
            newRegimeRebateLimit: 700000,
            cessRate: 0.04,
            standardDeductionOld: 50000,
            standardDeductionNew: 50000, // Applicable from FY 23-24
            // Include other year-specific deduction limits if they changed significantly
        };
    } else { // Rules for AY 2025-26 (FY 2024-25) - Assuming same as previous for now
         // IMPORTANT: UPDATE THESE VALUES BASED ON OFFICIAL FY 2024-25 RULES
        return {
            oldRegimeSlabs: [
                { limit: 0, rate: 0 },
                { limit: 250000, rate: 0.05 }, // Verify
                { limit: 500000, rate: 0.20 }, // Verify
                { limit: 1000000, rate: 0.30 }, // Verify
            ],
            newRegimeSlabs: [ 
                { limit: 0, rate: 0 },
                { limit: 300000, rate: 0.05 },   // Verify
                { limit: 600000, rate: 0.10 },  // Verify
                { limit: 900000, rate: 0.15 }, // Verify
                { limit: 1200000, rate: 0.20 }, // Verify
                { limit: 1500000, rate: 0.30 }, // Verify
            ],
            oldRegimeRebateLimit: 500000, // Verify
            newRegimeRebateLimit: 700000, // Verify
            cessRate: 0.04,
            standardDeductionOld: 50000,
            standardDeductionNew: 50000,
        };
    }
}

// --- Old Regime Calculation (Uses rules from getTaxRules) ---
function calculateOldRegimeTax(grossIncome, deductions, rules) {
    const standardDeduction = rules.standardDeductionOld;
    const taxableIncome = Math.max(0, grossIncome - standardDeduction - deductions.totalDeductions);
    const oldRegimeSlabs = rules.oldRegimeSlabs;
    let tax = calculateTaxSlab(taxableIncome, oldRegimeSlabs);
    
    if (taxableIncome <= rules.oldRegimeRebateLimit) {
       tax = 0;
    }
    
    const totalTax = tax > 0 ? tax * (1 + rules.cessRate) : 0;
    return { taxableIncomeOld: taxableIncome, taxPayableOld: Math.round(totalTax) };
}

// --- New Regime Calculation (Uses rules from getTaxRules) ---
function calculateNewRegimeTax(grossIncome, deductions, rules) {
    const standardDeduction = rules.standardDeductionNew;
    const taxableIncome = Math.max(0, grossIncome - standardDeduction);
    const newRegimeSlabs = rules.newRegimeSlabs;
    let tax = calculateTaxSlab(taxableIncome, newRegimeSlabs);

    if (taxableIncome <= rules.newRegimeRebateLimit) {
       tax = 0;
    }

    const totalTax = tax > 0 ? tax * (1 + rules.cessRate) : 0;
    return { taxableIncomeNew: taxableIncome, taxPayableNew: Math.round(totalTax) };
}

// --- Tax Calculation Route (Updated to use getTaxRules) ---
app.post("/api/calculate-tax", (req, res) => {
  try {
      const input = req.body;
      const assessmentYear = input.assessmentYear || "2025-26"; // Get AY from payload
      const rules = getTaxRules(assessmentYear); // Get rules for the selected AY
      
      console.log(`Calculating tax for AY: ${assessmentYear}`);

      // --- Parse Inputs (Keep as is) ---
      // ... basic, hra, special, etc. ...
      const basic = Number(input.basic || 0);
      const hraReceived = Number(input.hra || 0);
      const special = Number(input.special || 0);
      const lta = Number(input.lta || 0);
      const otherIncome = Number(input.otherIncome || 0);
      const employeePf = Number(input.epfContribution || 0);
      const professionalTax = Number(input.professionalTax || 0);
      const rentPaid = Number(input.rentPaid || 0);
      const isMetroCity = Boolean(input.isMetroCity || false);
      const homeLoanInterest = Number(input.homeLoanInterest || 0); // Sec 24b
      const savingsInterest = Number(input.deduction80TTA_savingsInterest || 0); // Sec 80TTA
      const npsContribution80CCD1B = Number(input.deduction80CCD1B_nps || 0); // Sec 80CCD(1B)
      const medInsuranceSelf = Number(input.deduction80D_selfFamily || 0); // Sec 80D Self
      const medInsuranceParents = Number(input.deduction80D_parents || 0); // Sec 80D Parents
      
      // Calculate Gross Salary (before exemptions like HRA)
      // Note: LTA exemption is NOT calculated here as it requires proof of travel.
      const grossSalary = basic + hraReceived + special + lta;
      const grossTotalIncome = grossSalary + otherIncome;

      // --- Calculate Deductions for Old Regime (Keep as is, but WARN about 80D) ---
      // ... hraExemption, 80C, 80D (simplified), 80CCD1B, 80TTA, 24b ...
      // WARNING: Simplified 80D limits used. Rules might differ slightly per AY.
      const hraExemption = calculateHraExemption(basic, hraReceived, rentPaid, isMetroCity);
      
      const deduction80C_items = [
          employeePf, 
          Number(input.deduction80C_ppf || 0), 
          Number(input.deduction80C_elss || 0), 
          Number(input.deduction80C_insurance || 0), 
          Number(input.deduction80C_housingLoanPrincipal || 0),
          Number(input.deduction80C_tuition || 0)
      ];
      const total80C = deduction80C_items.reduce((sum, val) => sum + val, 0);
      const capped80C = Math.min(total80C, 150000); // Cap 80C at 1.5L
      
      // Cap 80D, 80CCD1B, 80TTA
      // WARNING: Simplified 80D limits used (25k self/family, 50k parents). Does not account for senior citizens.
      const capped80D = Math.min(medInsuranceSelf, 25000) + Math.min(medInsuranceParents, 50000);
      const capped80CCD1B = Math.min(npsContribution80CCD1B, 50000);
      const capped80TTA = Math.min(savingsInterest, 10000);
      const capped24b = Math.min(homeLoanInterest, 200000); // Cap Sec 24b interest

      // Total Deductions Applicable under Old Regime (excluding Standard Deduction)
      const oldRegimeDeductions = {
          hraExemption: hraExemption,
          capped80C: capped80C,
          capped80D: capped80D,
          capped80CCD1B: capped80CCD1B,
          capped80TTA: capped80TTA,
          capped24b: capped24b,
          professionalTax: professionalTax, // Professional Tax is a deduction from Salary Income
          // Summing them up (PT is deducted before GTI, others after)
          totalDeductions: hraExemption + capped80C + capped80D + capped80CCD1B + capped80TTA + capped24b
      };
      
      // Adjust for PT (Keep as is)
      const incomeAfterPt = grossTotalIncome - professionalTax;

      // --- Calculate Tax for Both Regimes using selected rules ---
      const oldResult = calculateOldRegimeTax(incomeAfterPt, oldRegimeDeductions, rules);
      // New regime deductions might be different in older AYs, but pass empty for now
      const newResult = calculateNewRegimeTax(incomeAfterPt, {}, rules);

      // --- Prepare Final Response (Keep as is) --- 
      const taxPayableOld = oldResult.taxPayableOld;
      const taxPayableNew = newResult.taxPayableNew;
      const taxSavingsNewVsOld = taxPayableOld - taxPayableNew; // Positive if new saves tax
      let recommendedRegime = 'either';
      if (taxPayableNew < taxPayableOld) {
          recommendedRegime = 'new';
      } else if (taxPayableOld < taxPayableNew) {
          recommendedRegime = 'old';
      }

      const finalResult = {
          grossTotalIncome: Math.round(grossTotalIncome),
          netTaxableIncomeOld: Math.round(oldResult.taxableIncomeOld),
          netTaxableIncomeNew: Math.round(newResult.taxableIncomeNew),
          taxPayableOld: taxPayableOld,
          taxPayableNew: taxPayableNew,
          recommendedRegime: recommendedRegime,
          taxSavingsNewVsOld: Math.round(taxSavingsNewVsOld),
          assessmentYearUsed: assessmentYear // Optionally return the AY used
      };

      console.log("Final Calculation Result:", finalResult);
      res.json(finalResult);

  } catch (error) {
      console.error("Error during tax calculation:", error);
      res.status(500).json({ error: "Failed to calculate tax. An internal error occurred." });
  }
});

// --- Helper to get API Key from DB --- 
// Modify to handle missing userId (fetch global key)
async function getGeminiApiKey(userId) { // userId might be undefined now
    return new Promise((resolve, reject) => {
        // If userId is provided (e.g., from other authenticated routes), potentially fetch user-specific key (future enhancement?)
        // For now, always fetch the global key
        const sql = "SELECT value FROM settings WHERE key = ?"; 
        db.get(sql, ['geminiApiKey'], (err, row) => {
            if (err) {
                console.error("Error fetching API key:", err);
                reject("Database error fetching API key.");
            } else if (row && row.value) {
                resolve(row.value);
            } else {
                 console.warn("Gemini API Key not found in settings table.");
                resolve(null); // Key not found or not set
            }
        });
    });
}

// --- Helper to extract JSON from string (fallback) ---
function extractJsonFromString(str) {
    try {
        const jsonMatch = str.match(/\{.*\}/s);
        if (jsonMatch && jsonMatch[0]) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error("Fallback JSON extraction failed:", e);
    }
    return null;
}

// --- Document Upload Endpoint (Updated for Gemini) ---
app.post("/api/documents/upload", authenticateToken, upload.single('document'), async (req, res) => {
    const userId = req.user.id; 
    const file = req.file;
    console.log(`Received upload request for user ID: ${userId}, filename: ${file?.originalname}`);

    if (!file) {
        return res.status(400).json({ error: "No file uploaded or file type not allowed." });
    }

    // Remove TEMPORARY Hardcode
    /* 
    const apiKey = "AIzaSyB2TUPrXR8qQNcLselSNq8twBklnCU40a4"; 
    if (!apiKey) { 
         console.error("CRITICAL: Gemini API Key is not set!");
         return res.status(500).json({ error: "API Key configuration error." });
    }
    */
   
    // Restore original code to fetch from DB
    let apiKey;
    try {
        apiKey = await getGeminiApiKey();
        if (!apiKey) {
            return res.status(500).json({ error: "Gemini API Key not configured. Please set it via Admin settings." });
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
        console.error("Error during file processing or AI call:", error);
        res.status(500).json({ error: "Failed to process document." });
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

// --- Server Start ---
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 