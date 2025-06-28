#!/bin/bash

# DocSee-GUI Release Helper Script
# Automates version bumping and release tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src-tauri/tauri.conf.json" ]; then
    print_error "This script must be run from the docsee-gui project root"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Git working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.version' package.json)
print_info "Current version: $CURRENT_VERSION"

# Function to validate semantic version
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?$ ]]; then
        print_error "Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)"
        return 1
    fi
    return 0
}

# Function to compare versions
version_greater() {
    printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1 | grep -q "^$2$"
}

# Get new version from user
if [ $# -eq 0 ]; then
    echo ""
    echo "Version bump options:"
    echo "  1) Patch (${CURRENT_VERSION} → $(echo $CURRENT_VERSION | awk -F. '{$3++; print $1"."$2"."$3}'))"
    echo "  2) Minor (${CURRENT_VERSION} → $(echo $CURRENT_VERSION | awk -F. '{$2++; $3=0; print $1"."$2"."$3}'))"
    echo "  3) Major (${CURRENT_VERSION} → $(echo $CURRENT_VERSION | awk -F. '{$1++; $2=0; $3=0; print $1"."$2"."$3}'))"
    echo "  4) Custom version"
    echo ""
    read -p "Select option (1-4): " choice
    
    case $choice in
        1)
            NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$3++; print $1"."$2"."$3}')
            ;;
        2)
            NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$2++; $3=0; print $1"."$2"."$3}')
            ;;
        3)
            NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$1++; $2=0; $3=0; print $1"."$2"."$3}')
            ;;
        4)
            read -p "Enter new version: " NEW_VERSION
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
else
    NEW_VERSION=$1
fi

# Validate new version
if ! validate_version "$NEW_VERSION"; then
    exit 1
fi

# Check if new version is greater than current
if ! version_greater "$NEW_VERSION" "$CURRENT_VERSION"; then
    print_error "New version ($NEW_VERSION) must be greater than current version ($CURRENT_VERSION)"
    exit 1
fi

print_info "New version will be: $NEW_VERSION"

# Confirm with user
echo ""
read -p "🚀 This will create a new release v$NEW_VERSION. Continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    print_warning "Release cancelled"
    exit 0
fi

print_info "Creating release v$NEW_VERSION..."

# Update package.json
print_info "Updating package.json..."
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version

# Update tauri.conf.json
print_info "Updating tauri.conf.json..."
jq --arg version "$NEW_VERSION" '.version = $version' src-tauri/tauri.conf.json > tmp.json
mv tmp.json src-tauri/tauri.conf.json

# Update Cargo.toml if it exists
if [ -f "src-tauri/Cargo.toml" ]; then
    print_info "Updating Cargo.toml..."
    sed -i.bak "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
    rm -f src-tauri/Cargo.toml.bak
fi

# Verify updates
print_info "Verifying version updates..."
echo "  package.json: $(jq -r '.version' package.json)"
echo "  tauri.conf.json: $(jq -r '.version' src-tauri/tauri.conf.json)"
if [ -f "src-tauri/Cargo.toml" ]; then
    echo "  Cargo.toml: $(grep '^version =' src-tauri/Cargo.toml | head -1 | cut -d'"' -f2)"
fi

# Commit changes
print_info "Committing version bump..."
git add package.json src-tauri/tauri.conf.json
if [ -f "src-tauri/Cargo.toml" ]; then
    git add src-tauri/Cargo.toml
fi
git commit -m "🔖 Bump version to v$NEW_VERSION"

# Create and push tag
print_info "Creating and pushing tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Check if we have a remote and push
if git remote get-url origin >/dev/null 2>&1; then
    print_info "Pushing to origin..."
    git push origin $(git branch --show-current)
    git push origin "v$NEW_VERSION"
else
    print_warning "No origin remote found. You'll need to push manually:"
    echo "  git push origin $(git branch --show-current)"
    echo "  git push origin v$NEW_VERSION"
fi

print_success "Release v$NEW_VERSION has been created!"
print_info "GitHub Actions will now build and publish the release automatically."
print_info "Monitor progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"

echo ""
print_info "🎉 What happens next:"
echo "  1. GitHub Actions will build for all platforms"
echo "  2. Release artifacts will be uploaded automatically"
echo "  3. Release notes will be generated"
echo "  4. GitHub release will be published"
echo ""
print_info "Release will be available at:"
echo "  https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/v$NEW_VERSION"
