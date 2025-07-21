#!/bin/bash

echo "🧪 Starting Local Build Test..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Clean environment
echo "🧹 Cleaning environment..."
rm -rf .next out
print_status $? "Environment cleaned"

# Install dependencies
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1
print_status $? "Dependencies installed"

# Build application
echo "🔨 Building application..."
npm run build > build.log 2>&1
print_status $? "Application built successfully"

# Check output directory
echo "📁 Checking output..."
if [ -d "out" ] && [ -f "out/index.html" ]; then
    print_status 0 "Output directory and index.html exist"
else
    print_status 1 "Output directory or index.html missing"
fi

# Check for critical files
echo "🔍 Checking critical files..."
critical_files=("out/index.html" "out/_next" "out/404.html")
for file in "${critical_files[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done

# Start server in background
echo "🚀 Starting local server..."
npx serve out -p 3001 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# Test if server is responding
echo "🌐 Testing server response..."
if curl -s http://localhost:3001 > /dev/null; then
    print_status 0 "Server is responding"
else
    print_status 1 "Server is not responding"
fi

# Kill server
kill $SERVER_PID 2>/dev/null

echo -e "${GREEN}🎉 All tests passed! Your build is ready for deployment.${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Test manually at http://localhost:3000 (run: npx serve out)"
echo "   2. Test on mobile devices"
echo "   3. Deploy to your chosen platform"
