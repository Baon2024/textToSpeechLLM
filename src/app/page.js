'use client'
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {

  const [ text, setText ] = useState()

  useEffect(() => {
    console.log("value of text is:", text)
  })

  async function sendToBackend() {
    const response = await fetch('http://localhost:3002/textToSpeech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      }) 
    })

    //const data = await response.json()
    //console.log("data returned from backend is:", data)

    const audioBlob = await response.blob();  // Because response is audio (binary)
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create an audio element to play it
    const audio = new Audio(audioUrl);
    audio.play();
    console.log("return successfull!")
  }


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <p>add text input</p>
      <label>Enter text to send to LLM</label>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendToBackend}>send text to llm</button>
    </div>
  );
}
