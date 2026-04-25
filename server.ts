import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // MyFatoorah API Configuration
  const MYFATOORAH_API_URL = "https://apitest.myfatoorah.com"; // Use demo URL for now
  const MYFATOORAH_TOKEN = process.env.MYFATOORAH_API_KEY;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Initiate Payment
  app.post("/api/payment/initiate", async (req, res) => {
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
          PaymentMethodId: 2, // KNET or other method
          CustomerName: customerName,
          DisplayCurrencyIso: currency || "OMR",
          MobileCountryCode: "968",
          CustomerMobile: "12345678",
          CustomerEmail: customerEmail,
          InvoiceValue: amount,
          CallBackUrl: `${process.env.APP_URL}/payment/success?orderId=${orderId}`,
          ErrorUrl: `${process.env.APP_URL}/payment/fail?orderId=${orderId}`,
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
      if (error.response) {
        console.error("MyFatoorah API Error Detail:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("MyFatoorah Error:", error.message);
      }
      const apiError = error.response?.data;
      res.status(200).json({ 
        IsSuccess: false, 
        Message: apiError?.Message || apiError?.error || error.message || "Payment initiation failed" 
      });
    }
  });

  // Verify Payment
  app.get("/api/payment/verify", async (req, res) => {
    try {
      const { paymentId } = req.query;

      if (!MYFATOORAH_TOKEN) {
        return res.status(200).json({ 
          IsSuccess: false, 
          Message: "MyFatoorah API key is missing." 
        });
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

      res.json(response.data);
    } catch (error: any) {
      console.error("Verification Error:", error.response?.data || error.message);
      const apiError = error.response?.data;
      res.status(200).json({ 
        IsSuccess: false, 
        Message: apiError?.Message || apiError?.error || error.message || "Verification failed" 
      });
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
