"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
// Enable CORS
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// TMWEasy API Configuration
const TMWEASY_CONFIG = {
    username: "jakkaphonezerox04",
    password: "oam0967788993",
    con_id: "108444",
    api_key: "4c2012ece2c849a82bad840fd568b914",
    promptpay_id: "0959836162",
    type: "01",
    workerUrl: "https://tmweasy-proxy.vixahub.workers.dev"
};
// In-memory credits storage (in production, use Firestore)
const userCredits = {
    'demo_user': 1750
};
// TMWEasy Create Payment
app.post('/tmweasy/create-pay', async (req, res) => {
    var _a;
    try {
        const { amount, ref1 } = req.body;
        if (!amount || amount < 10) {
            return res.status(400).json({
                success: false,
                error: "จำนวนเงินขั้นต่ำ 10 บาท"
            });
        }
        console.log("Creating payment:", { amount, ref1 });
        const params = new URLSearchParams({
            username: TMWEASY_CONFIG.username,
            password: TMWEASY_CONFIG.password,
            con_id: TMWEASY_CONFIG.con_id,
            amount: amount.toString(),
            ref1: ref1,
            method: "create_pay"
        });
        console.log("Sending to worker:", `${TMWEASY_CONFIG.workerUrl}?${params.toString()}`);
        const response = await fetch(`${TMWEASY_CONFIG.workerUrl}?${params.toString()}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; VIXAHUB/1.0)",
            }
        });
        console.log("Worker response status:", response.status);
        if (!response.ok) {
            console.error(`Worker responded with ${response.status}`);
            const errorText = await response.text();
            console.error("Worker error:", errorText);
            throw new Error(`Worker responded with ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        console.log("Worker result:", result);
        if (result.success && result.data) {
            console.log("Payment created successfully:", result.data);
            return res.json({
                success: true,
                ...result.data,
                source: result.source || 'worker',
                timestamp: result.timestamp
            });
        }
        else {
            console.error("Worker returned unsuccessful result:", result);
            return res.status(500).json({
                success: false,
                error: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.msg) || "Failed to create payment",
                details: result
            });
        }
    }
    catch (error) {
        console.error("Create payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// TMWEasy Get Details
app.post('/tmweasy/get-details', async (req, res) => {
    var _a;
    try {
        const { id_pay } = req.body;
        if (!id_pay) {
            return res.status(400).json({
                success: false,
                error: "Missing payment ID"
            });
        }
        console.log("Getting payment details for:", id_pay);
        const params = new URLSearchParams({
            username: TMWEASY_CONFIG.username,
            password: TMWEASY_CONFIG.password,
            con_id: TMWEASY_CONFIG.con_id,
            id_pay: id_pay,
            promptpay_id: TMWEASY_CONFIG.promptpay_id,
            type: TMWEASY_CONFIG.type,
            method: "detail_pay"
        });
        const response = await fetch(`${TMWEASY_CONFIG.workerUrl}?${params.toString()}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; VIXAHUB/1.0)",
            }
        });
        if (!response.ok) {
            throw new Error(`Worker responded with ${response.status}`);
        }
        const result = await response.json();
        console.log("Worker detail result:", result);
        if (result.success && result.data) {
            const processedData = { ...result.data };
            // Look for QR code in various possible fields
            const qrFields = [
                'qr_image_base64', 'qrcode', 'qr_code', 'qr', 'image',
                'qr_raw_data', 'qr_image', 'promptpay_qr', 'base64',
                'png_base64', 'qr_png', 'payment_qr'
            ];
            for (const field of qrFields) {
                const value = processedData[field];
                if (typeof value === 'string' && value.length > 100) {
                    console.log(`Found QR in field '${field}' (length: ${value.length})`);
                    const cleanValue = value
                        .replace(/^data:image\/[^;]+;base64,/, '')
                        .replace(/\s/g, '');
                    processedData.qr_image_base64 = cleanValue;
                    console.log(`Set QR from field '${field}', cleaned length: ${cleanValue.length}`);
                    break;
                }
            }
            return res.json({
                success: true,
                ...processedData,
                source: result.source || 'worker',
                timestamp: result.timestamp
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.msg) || "Failed to get payment details",
                details: result
            });
        }
    }
    catch (error) {
        console.error("Get payment details error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// TMWEasy Confirm Payment
app.post('/tmweasy/confirm-payment', async (req, res) => {
    try {
        const { id_pay, clientIP } = req.body;
        if (!id_pay) {
            return res.status(400).json({
                success: false,
                error: "Missing payment ID"
            });
        }
        const params = new URLSearchParams({
            username: TMWEASY_CONFIG.username,
            password: TMWEASY_CONFIG.password,
            con_id: TMWEASY_CONFIG.con_id,
            id_pay: id_pay,
            ip: clientIP || "127.0.0.1",
            method: "confirm"
        });
        const response = await fetch(`${TMWEASY_CONFIG.workerUrl}?${params.toString()}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; VIXAHUB/1.0)",
            }
        });
        if (!response.ok) {
            throw new Error(`Worker responded with ${response.status}`);
        }
        const result = await response.json();
        console.log("Confirm payment result:", result);
        return res.json(result);
    }
    catch (error) {
        console.error("Confirm payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// TMWEasy Demo Confirm
app.post('/tmweasy/demo-confirm', async (req, res) => {
    try {
        const { id_pay } = req.body;
        // Demo response for testing
        return res.json({
            success: true,
            status: 1,
            amount: 50,
            date_pay: new Date().toISOString(),
            msg: "Demo payment confirmed",
            id_pay: id_pay
        });
    }
    catch (error) {
        console.error("Demo confirm error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});
// Update User Credits
app.get('/user/update-credits', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                error: "Missing user ID"
            });
        }
        const credits = userCredits[userId] || 0;
        return res.json({
            success: true,
            data: {
                userId: userId,
                credits: credits,
                lastUpdated: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error("Get credits error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});
app.post('/user/update-credits', async (req, res) => {
    try {
        const { userId, amount, paymentId, type } = req.body;
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }
        const creditsToAdd = type === 'topup' ? amount * 10 : amount; // 1 บาท = 10 เครดิต
        const currentCredits = userCredits[userId] || 0;
        const newBalance = currentCredits + creditsToAdd;
        userCredits[userId] = newBalance;
        console.log(`💰 Credits updated for user ${userId}:`, {
            amount,
            creditsAdded: creditsToAdd,
            newBalance
        });
        return res.json({
            success: true,
            data: {
                userId: userId,
                amount: amount,
                creditsAdded: creditsToAdd,
                newBalance: newBalance,
                paymentId: paymentId,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error("Update credits error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});
// TMWEasy Webhook
app.post('/tmweasy/webhook', async (req, res) => {
    try {
        console.log("🔔 TMWEasy Webhook received");
        const { data, signature } = req.body;
        console.log("📥 Webhook data:", data);
        console.log("🔐 Webhook signature:", signature);
        if (!data || !signature) {
            console.error("❌ Missing data or signature");
            return res.status(400).json({
                status: 0,
                error: "Missing data or signature"
            });
        }
        // Verify signature (MD5 hash of data:api_key)
        const expectedSignature = crypto_1.default
            .createHash('md5')
            .update(`${data}:${TMWEASY_CONFIG.api_key}`)
            .digest('hex');
        console.log("🔍 Expected signature:", expectedSignature);
        console.log("🔍 Received signature:", signature);
        if (signature !== expectedSignature) {
            console.error("❌ Invalid signature");
            return res.status(401).json({
                status: 0,
                error: "Invalid signature"
            });
        }
        // Parse payment data
        const paymentData = JSON.parse(data);
        console.log("💰 Payment data:", paymentData);
        const { id_pay, ref1, amount_check, amount, date_pay } = paymentData;
        if (!id_pay || !amount) {
            console.error("❌ Invalid payment data");
            return res.status(400).json({
                status: 0,
                error: "Invalid payment data"
            });
        }
        // Update user credits
        const userId = (ref1 === null || ref1 === void 0 ? void 0 : ref1.startsWith('user_')) ? 'demo_user' : ref1;
        const creditsToAdd = parseFloat(amount) * 10; // 1 บาท = 10 เครดิต
        const currentCredits = userCredits[userId || 'demo_user'] || 0;
        const newBalance = currentCredits + creditsToAdd;
        userCredits[userId || 'demo_user'] = newBalance;
        console.log("💳 Credit update result:", {
            userId: userId || 'demo_user',
            amount: parseFloat(amount),
            creditsAdded: creditsToAdd,
            newBalance: newBalance
        });
        // Respond success to TMWEasy
        return res.json({ status: 1 });
    }
    catch (error) {
        console.error("❌ Webhook error:", error);
        return res.status(500).json({
            status: 0,
            error: "Internal server error"
        });
    }
});
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map