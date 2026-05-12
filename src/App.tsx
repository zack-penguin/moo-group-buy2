import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase credentials
const supabaseUrl = "https://uulqaskjgubfovyeqyil.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bHFhc2tqZ3ViZm92eWVxeWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODQ0NjQsImV4cCI6MjA5NDA2MDQ2NH0.XfMovxnMKHLZvsxHLBSxGzL4h0pBBpcEaoPV2Xtct7g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCT_IMAGES = {
  wagyu_rump_cap: "data:image/jpeg;base64,...", // your existing base64 data continues
  // all your other products remain unchanged
};

// 🧩 Supabase functions
export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*");
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data;
}

export async function saveOrder(orderData) {
  const { data, error } = await supabase.from("orders").insert([orderData]);
  if (error) {
    console.error("Error saving order:", error);
    return null;
  }
  return data;
}

export async function closeRound(roundId) {
  const { data, error } = await supabase
    .from("rounds")
    .update({ status: "closed" })
    .eq("id", roundId);

  if (error) {
    console.error("Error closing round:", error);
    return null;
  }
  return data;
}
