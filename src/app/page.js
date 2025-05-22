'use client'
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function Home() {

  const [ text, setText ] = useState()
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    console.log("value of text is:", text)
    console.log("value of audioBlob is:", audioBlob)
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

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
    const mediaRecorder = new MediaRecorder(stream)

    console.log("recording started!!")
    
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      setAudioBlob(audioBlob);
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
    };

    mediaRecorder.start();
    setIsRecording(true);

  }

  async function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("recording ended!!")
    }
  }

  const sendAudioToBackend = async () => {

    if (!(audioBlob instanceof Blob)) {
      console.error('Invalid Blob:', audioBlob);
      return;
    }


    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav'); // or 'audio.mp3'

    console.log("about to send audio to backend")
  
    const response = await fetch('http://localhost:3002/upload', {
      method: 'POST',
      body: formData,
    });
  
    const audioBlob2 = await response.blob();  // Because response is audio (binary)
    const audioUrl = URL.createObjectURL(audioBlob2);

    // Create an audio element to play it
    const audio = new Audio(audioUrl);
    audio.play();
    console.log("return successfull!")
  };


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <p>add text input</p>
      <label>Enter text to send to LLM</label>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendToBackend}>send text to llm</button>
      <p>or record your input as audio</p>
      <div>
      <h2>React Audio Recorder</h2>
      <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
      <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
      {audioURL && (
        <div>
          <h4>Preview:</h4>
          <audio ref={audioRef} src={audioURL} controls />
        </div>
      )}
      <button onClick={sendAudioToBackend}>send audio to backend</button>
    </div>
    </div>
  );
}
