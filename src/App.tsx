import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Your Supabase credentials
const supabaseUrl = "https://uulqaskjgubfovyeqyil.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bHFhc2tqZ3ViZm92eWVxeWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODQ0NjQsImV4cCI6MjA5NDA2MDQ2NH0.XfMovxnMKHLZvsxHLBSxGzL4h0pBBpcEaoPV2Xtct7g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🧩 Fetch all orders when the app loads
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("orders").select("*");
      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  // ✅ Save a new order
  const saveOrder = async (orderData) => {
    const { data, error } = await supabase.from("orders").insert([orderData]);
    if (error) {
      console.error("Error saving order:", error);
    } else {
      console.log("Order saved:", data);
      setOrders([...orders, ...data]); // update local state
    }
  };

  // ✅ Close a round
  const closeRound = async (roundId) => {
    const { data, error } = await supabase
      .from("rounds")
      .update({ status: "closed" })
      .eq("id", roundId);

    if (error) {
      console.error("Error closing round:", error);
    } else {
      console.log("Round closed:", data);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              {order.client_id} ordered {order.product} (qty: {order.qty})
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() =>
          saveOrder({ client_id: 1, product: "Wagyu Rump Cap", qty: 2 })
        }
      >
        Submit Order
      </button>

      <button onClick={() => closeRound(123)}>Close Round</button>
    </div>
  );
}

export default App;
