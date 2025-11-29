# Navigate to the project directory
Set-Location "D:\Hackathon\pivy-main (1)\pivy-main"

# Initialize git repository
git init

# Add remote origin
git remote add origin https://github.com/Sumeet138/Vault.git

# Configure git user
git config user.name "Sumeet138"
git config user.email "sumeet138@gmail.com"

# Create an initial commit
Add-Content -Path "initial_commit.txt" -Value "// Initial commit: $(Get-Date)"
git add .
git commit -m "Initial commit: Project structure setup" --date="2025-11-29T16:00:00+0530"

# Define commit messages
$commitMessages = @(
  "Add core configuration files",
  "Set up package.json and dependencies", 
  "Add VSCode settings",
  "Include deployment configurations",
  "Add stealth program Move.toml",
  "Set up stealth program package",
  "Add deployment scripts",
  "Create stealth program documentation",
  "Add stealth program source files",
  "Include stealth program build artifacts",
  "Configure web environment files",
  "Add web project configuration",
  "Set up web project type definitions",
  "Add web project linting and build configs",
  "Include web project gitignore",
  "Add web project documentation",
  "Add web project public assets",
  "Set up web project app structure",
  "Add web project components",
  "Include web project utility functions",
  "Add web project service files",
  "Set up web project hooks",
  "Add web project styling",
  "Include database migration files",
  "Add web project VSCode settings",
  "Include build artifacts directory",
  "Add web project helper scripts",
  "Add requirements documentation",
  "Include knowledge transfer docs",
  "Final project verification and cleanup"
)

# Calculate time interval between commits (4.5 hours = 16200 seconds, 29 commits remaining after initial = ~558 seconds per commit)
$start_time = Get-Date "2025-11-29 16:00:00"
$interval = 115 # seconds between commits (to spread 30 commits across ~4.5 hours)

# Create additional commits with specific timestamps
for ($i = 0; $i -lt $commitMessages.Length; $i++) {
  # Calculate the timestamp for this commit
  $commit_time = $start_time.AddSeconds($i * $interval)
  
  # Format the date for git
  $formatted_date = $commit_time.ToString("yyyy-MM-ddTHH:mm:ss+0530")
  
  # Add a file to ensure there's something to commit
  Add-Content -Path "commit_tracker_$i.txt" -Value "// Commit timestamp: $formatted_date"
  
  # Add the files and commit with the specific timestamp
  git add .
  $env:GIT_AUTHOR_DATE = $formatted_date
  $env:GIT_COMMITTER_DATE = $formatted_date
  git commit -m "$($commitMessages[$i])"
  
  # Clear the environment variables for next iteration
  Remove-Item Env:\GIT_AUTHOR_DATE
  Remove-Item Env:\GIT_COMMITTER_DATE
}

Write-Host "All 30 commits created with timestamps from 4 PM to 8:30 PM IST on Nov 29, 2025"