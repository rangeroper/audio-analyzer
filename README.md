![Description](https://github.com/rangeroper/audio-analyzer/blob/main/arc_proto.png?raw=true)

## 🚀 Stack & Features

- 🌐 **frontend:** [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- 🎙️ **transcription:** [OpenAI Whisper](https://openai.com/research/whisper) (`whisper-1` model)
- 🤖 **summarization:** OpenAI GPT (`gpt-4o`)
- 🔊 **audio compression:** Uses `ffmpeg` to reduce audio size by lowering bitrate to 64k before upload
- ☁️ **vercel blob storage:** via a custom API route (`/api/upload-blob`) using `@vercel/blob`
- 🎵 **supported format:** MP3

## ⚙️ Workflow

- **Youtube URL**

1. provide youtube url  
2. download audio from youtube  
3. upload original audio to vercel blob storage  
4. compress audio (lower bitrate to ~64k)  
5. upload compressed audio to vercel blob storage  
6. transcribe audio with openai whisper (`whisper-1`)  
7. summarize transcript with gpt-4o

---

- **Direct Audio Upload**

1. upload audio file  
2. compress audio (lower bitrate to ~64k)  
3. upload compressed audio to vercel blob storage  
4. transcribe audio with openai whisper (`whisper-1`)  
5. summarize transcript with gpt-4o

## 🖥️ Installation

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repo-url>
   cd video-analyzer
   npm install

2. Create a `.env` file in the root with these variables:

   ```env
   OPENAI_API_KEY=your-openai-api-key
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-read-write-token
   YTDLP_PATH=optional-path-to-yt-dlp-executable  # defaults to 'yt-dlp' if in system PATH
   BASE_URL=https://your-domain.com

3. Run on localhost to preview/test
   ```bash
   npm run dev

4. When ready to deploy, generate your production build
   ```bash
   npm run build
