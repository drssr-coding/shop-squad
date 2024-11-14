import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from 'react';

interface PaypalButtonProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: any) => void;
}

export function PaypalButton({ amount, onSuccess, onError }: PaypalButtonProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      {error && (
        <div className="text-red-500 text-sm mb-4 text-center">
          {error}
        </div>
      )}
      
      <PayPalScriptProvider options={{ 
        "client-id": "AS8NrsiUls__6Cvj7Z_ol5HVF2CFk24kAgXIA24g4iOlisz3eFmwRX8xVZ88iHpVWx79qRNNHuiVP1zk",
        currency: "USD"
      }}>
        <PayPalButtons
          style={{ layout: "horizontal" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: "USD"
                  },
                  description: "Shopping Squad Payment"
                }
              ]
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              try {
                const order = await actions.order.capture();
                console.log("Payment successful", order);
                onSuccess();
              } catch (err) {
                console.error("Error capturing payment:", err);
                setError("Failed to complete payment. Please try again.");
                onError(err);
              }
            }
          }}
          onError={(err) => {
            console.error("Payment error:", err);
            setError("Payment failed. Please try again.");
            onError(err);
          }}
          onCancel={() => {
            setError("Payment cancelled. Please try again.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}