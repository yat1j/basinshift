import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "BASINSHIFT — Predict Beyond the Basin",
  description:
    "Hydrology-informed machine learning for river-discharge forecasting and high-flow-risk analysis across unfamiliar catchments.",
  keywords: [
    "Hydrology",
    "River Discharge Forecasting",
    "Machine Learning",
    "Catchment Generalization",
    "Linear Reservoirs",
    "LightGBM",
    "USGS",
    "CAMELS",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#050a0f" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-basin-darkest text-slate-100 flex flex-col min-h-screen selection:bg-basin-cyan/20 selection:text-white">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
