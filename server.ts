import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import { getEnv } from "./src/lib/env";

dotenv.config();

let adminApp: any = null;

const getOrderDb = () => {
  if (!adminApp) {
    try {
      const saPath = path.join(process.cwd(), "firebase-service-account.json");
      if (fs.existsSync(saPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        }, 'server-admin');
        console.log("Firebase Admin initialized with service account.");
      } else {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
          adminApp = admin.initializeApp({
            projectId: firebaseConfig.projectId,
          }, 'server-admin');
          console.warn("Service account not found, initialized with projectId only.");
        } else {
          console.error("No firebase config found.");
          return null;
        }
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      return null;
    }
  }

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : {};
    
    if (firebaseConfig.firestoreDatabaseId) {
      return admin.firestore(adminApp);
    }
    return admin.firestore(adminApp);
  } catch (error) {
    console.error("Error getting Firestore instance:", error);
    return null;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // MyFatoorah API Configuration
  const MYFATOORAH_API_URL = "https://apitest.myfatoorah.com"; // Use demo URL for now
  const MYFATOORAH_TOKEN = getEnv("MYFATOORAH_API_KEY");

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Initiate Payment
  app.post("/api/payment/initiate", async (req, res) => {
    // ... (rest of initiate logic) ...
    try {
      const { amount, currency, customerName, customerEmail, orderId } = req.body;
      
      if (!MYFATOORAH_TOKEN) {
        return res.status(200).json({ 
          IsSuccess: false, 
          Message: "MyFatoorah API key is missing. Please set MYFATOORAH_API_KEY in secrets." 
        });
      }

      const response = await axios.post(
        `${MYFATOORAH_API_URL}/v2/ExecutePayment`,
        {
          PaymentMethodId: 2, 
          CustomerName: customerName,
          DisplayCurrencyIso: currency || "OMR",
          MobileCountryCode: "968",
          CustomerMobile: "12345678",
          CustomerEmail: customerEmail,
          InvoiceValue: amount,
          CallBackUrl: `${getEnv("APP_URL")}/payment/success?orderId=${orderId}`,
          ErrorUrl: `${getEnv("APP_URL")}/payment/fail?orderId=${orderId}`,
          Language: "en",
          CustomerReference: orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${MYFATOORAH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      // ... (error handling) ...
      console.error("MyFatoorah Error:", error.message);
      res.status(200).json({ 
        IsSuccess: false, 
        Message: error.message || "Payment initiation failed" 
      });
    }
  });

  // Verify Payment
  app.get("/api/payment/verify", async (req, res) => {
    try {
      const { paymentId, orderId } = req.query;

      if (!MYFATOORAH_TOKEN) {
        return res.status(200).json({ IsSuccess: false, Message: "MyFatoorah API key is missing." });
      }

      const response = await axios.post(
        `${MYFATOORAH_API_URL}/v2/GetPaymentStatus`,
        {
          Key: paymentId,
          KeyType: "PaymentId",
        },
        {
          headers: {
            Authorization: `Bearer ${MYFATOORAH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const statusData = response.data;
      
      // If payment is successful, update order status on the server
      if (statusData.IsSuccess && statusData.Data.InvoiceStatus === "Paid") {
        const targetOrderId = orderId || statusData.Data.CustomerReference;
        if (targetOrderId) {
          const db = getOrderDb();
          if (!db) {
            console.error("Firestore DB initialization failed. Could not update order.");
          } else {
            const orderRef = db.collection("orders").doc(targetOrderId as string);
            const orderDoc = await orderRef.get();
            
            if (orderDoc.exists) {
              const orderData = orderDoc.data();
              await orderRef.update({
                status: "paid",
                paymentId: paymentId as string,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });

              // Create notification for user
              await db.collection("notifications").add({
                userId: orderData?.userId,
                title: { en: 'Order Confirmed', ar: 'تم تأكيد الطلب' },
                body: { 
                  en: `Your payment for order #${(targetOrderId as string).slice(0, 5)} was successful. We're processing it now!`, 
                  ar: `تمت عملية الدفع للطلب رقم #${(targetOrderId as string).slice(0, 5)} بنجاح. نحن نقوم بمعالجته الآن!` 
                },
                type: 'order_update',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                metadata: { orderId: targetOrderId }
              });

              console.log(`Order ${targetOrderId} updated to paid by server.`);
            }
          }
        }
      }

      res.json(statusData);
    } catch (error: any) {
      console.error("Verification Error:", error.response?.data || error.message);
      res.status(200).json({ IsSuccess: false, Message: error.message || "Verification failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
