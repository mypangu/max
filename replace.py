import os

# Folder containing your HTML files
folder_path = "share_pages"

# Text to replace
old_url = "https://purushothmathav.github.io/streamify/"
new_url = "https://streamify.panguplay.in/"

# Loop through all files in the folder
for filename in os.listdir(folder_path):
    if filename.lower().endswith(".html"):  # only HTML files
        file_path = os.path.join(folder_path, filename)
        
        # Read the file
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace all occurrences
        updated_content = content.replace(old_url, new_url)
        
        # Write back to the file (overwrite)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        
        print(f"Updated: {filename}")

print("✅ All HTML files updated.")
