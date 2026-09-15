#!/bin/bash

echo "📊 Generando coverage para ambos proyectos..."
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📍 Backend (Go)..."
cd "$PROJECT_ROOT/backend"
go test ./... -coverprofile=coverage.out -covermode=atomic -v
go tool cover -html=coverage.out -o coverage/index.html
BACKEND_COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
echo "✅ Backend coverage: $BACKEND_COVERAGE"
echo ""

echo "📍 Frontend (React)..."
cd "$PROJECT_ROOT/frontend"
npm run test:coverage 2>&1 | tail -15
echo "✅ Frontend coverage generado"
echo ""

echo "════════════════════════════════════════"
echo "✅ Coverage Reports Ready!"
echo "════════════════════════════════════════"
echo ""
echo "📊 Backend Coverage:"
echo "   file://$PROJECT_ROOT/backend/coverage/index.html"
echo ""
echo "📊 Frontend Coverage:"
echo "   file://$PROJECT_ROOT/frontend/coverage/index.html"
echo ""
