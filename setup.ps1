# CodeSync Quick Start Script for Windows PowerShell

Write-Host "🚀 CodeSync Setup & Installation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB is not running. Please start MongoDB service" -ForegroundColor Yellow
    Write-Host "   Run: net start MongoDB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location -Path "backend"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location -Path "../frontend"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location -Path ".."

# Check for .env file
Write-Host ""
Write-Host "🔧 Checking configuration..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "   ⚠️  Please update backend/.env with your configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update backend/.env with your MongoDB URI and JWT secret" -ForegroundColor White
Write-Host "   2. Start MongoDB if not running: net start MongoDB" -ForegroundColor White
Write-Host "   3. Start backend: cd backend; npm run dev" -ForegroundColor White
Write-Host "   4. Start frontend (new terminal): cd frontend; npm run dev" -ForegroundColor White
Write-Host "   5. Open http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Overview and performance metrics" -ForegroundColor White
Write-Host "   - SETUP.md - Detailed setup instructions" -ForegroundColor White
Write-Host "   - MODERNIZATION_SUMMARY.md - What was improved" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy Coding!" -ForegroundColor Green
