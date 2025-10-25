# 1️⃣ Use the official Bun image (includes Node, npm, and Bun)
FROM oven/bun:1

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first for dependency caching
COPY package*.json bun.lockb* ./

# 4️⃣ Install dependencies with Bun
RUN bun install

# 5️⃣ Copy the rest of the source code
COPY . .

# 6️⃣ Expose backend port
EXPOSE 5000

# 7️⃣ Set environment variable (optional)
# ENV NODE_ENV=production

# 8️⃣ Run the backend using Bun
CMD ["bun", "start"]
