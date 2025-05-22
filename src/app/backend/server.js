import express from 'express'
import cors from "cors";
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import { CohereClient } from 'cohere-ai';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const cohere = new CohereClient({
    token: 'vjYSOGW1eb5SG7D8Sqk8cZX4ecmxpdfJC0dhbLza',
  });

const upload = multer({ dest: 'uploads/' });

const app = express()

const PORT = 3002

const VOICE_ID = 'uju3wxzG5OhpWcoi3SMy'

dotenv.config()

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY

console.log("ELEVEN_API_KEY in backend is:", ELEVEN_API_KEY)



app.use(cors())
app.use(bodyParser.json())

app.post('/textToSpeech', async (req, res) => {

    const userQuery = req.body.text;
    console.log("userQuery in backend is:", userQuery);

    //res.status(200).json({ message: 'everything okay' });

    /*const mp3Stream = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // or "shimmer", "echo", etc.
        input: text,
        response_format: "mp3",
      });
    
      // Set headers for audio response
      res.setHeader('Content-Type', 'audio/mpeg');
      mp3Stream.pipe(res); // Stream it back to the frontend*/

      const response = await cohere.chat({
        model: 'command-r',
        message: userQuery,
        chatHistory: [
          {
            role: 'SYSTEM',
            message:
              "Answer the user's query",
          },
        ],
        temperature: 0.3,
        maxTokens: 512,
      });
      
      const textToSpeech = response.text
      console.log("textToSpeech returned from cohere is:", textToSpeech)
    

      try {
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: textToSpeech,
            model_id: 'eleven_monolingual_v1', // or 'eleven_multilingual_v2'
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });
    
        if (!elevenRes.ok) {
          const error = await elevenRes.text();
          console.error(error);
          return res.status(500).send('Failed to fetch audio from ElevenLabs');
        }
    
        const arrayBuffer = await elevenRes.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

res.set({
  'Content-Type': 'audio/mpeg',
  'Content-Disposition': 'inline; filename="speech.mp3"',
});
res.send(buffer);

        //elevenRes.body.pipe(res); // Stream audio directly to the frontend
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }


})

app.post('/upload', upload.single('file'), async (req, res) => {
    
    const filePath = path.resolve(req.file.path);
    const audioBuffer = fs.readFileSync(filePath);

    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' }); // or 'audio/mp3'

    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVEN_API_KEY });
  
    const transcription = await elevenlabs.speechToText.convert({
        file: audioBlob,
        modelId: 'scribe_v1',
        tagAudioEvents: true,
        languageCode: 'eng',
        diarize: true,
      });
  
    
    console.log("text converted from speech in backend is:", transcription);
    fs.unlinkSync(filePath); // clean up file
    //res.json(result);

    let userQuery = transcription.text;

    
    console.log("value of userQuery after iterating through transcription objects is:", userQuery)
  

    const response1 = await cohere.chat({
        model: 'command-r',
        message: userQuery,
        chatHistory: [
          {
            role: 'SYSTEM',
            message:
              "Answer the user's query",
          },
        ],
        temperature: 0.3,
        maxTokens: 512,
      });
      
      const textToSpeech = response1.text
      console.log("textToSpeech returned from cohere is:", textToSpeech)
    

      try {
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: textToSpeech,
            model_id: 'eleven_monolingual_v1', // or 'eleven_multilingual_v2'
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });
    
        if (!elevenRes.ok) {
          const error = await elevenRes.text();
          console.error(error);
          return res.status(500).send('Failed to fetch audio from ElevenLabs');
        }
    
        const arrayBuffer = await elevenRes.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

res.set({
  'Content-Type': 'audio/mpeg',
  'Content-Disposition': 'inline; filename="speech.mp3"',
});
res.send(buffer);

        //elevenRes.body.pipe(res); // Stream audio directly to the frontend
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }







});




app.listen(PORT, console.log(`server running on port ${PORT}`))