# How to Share Your Game

You asked for a "safe and easy" way to share this game with friends. Here are the best options:

## Option 1: Local Network (Easiest for same WiFi)
If your friends are on the same WiFi network as you, you can share it directly from your computer without deploying anything.

1.  Open your terminal in the project folder.
2.  Run the following command:
    ```bash
    npm run dev -- --host
    ```
3.  Look for the **Network** URL in the output (e.g., `http://192.168.1.5:5173`).
4.  Share that URL with your friends. They can open it on their phones or laptops!

## Option 2: Vercel (Best for Internet)
To share with friends over the internet, deploying to Vercel is free, safe, and very easy.

1.  **Create a GitHub Repository**:
    *   Go to [GitHub.com](https://github.com) and create a new repository.
    *   Push your code to this repository.
2.  **Deploy on Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and sign up (you can use your GitHub account).
    *   Click "Add New..." -> "Project".
    *   Select your GitHub repository.
    *   Click "Deploy".
3.  Vercel will give you a live URL (e.g., `https://your-game.vercel.app`) that you can share with anyone.
