"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "./components/Navbar";  // Import the navbar
import dynamic from 'next/dynamic';

const MapPanel = dynamic(() => import('./components/MapPanel'), {
  ssr: false,
});

export default function Home() {

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Add the navbar at the top */}
      <Navbar />
      <MapPanel/>
    </div>
  );
}