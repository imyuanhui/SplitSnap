# SplitSnap - Flask File Upload Application

A modern Flask web application for secure file uploads with a beautiful drag-and-drop interface.

## Features

- 🎨 Modern, responsive UI with drag-and-drop functionality
- 📁 Support for multiple file types (txt, pdf, png, jpg, jpeg, gif, doc, docx)
- 🔒 Secure file handling with filename sanitization
- 📊 Real-time upload progress tracking
- 💾 Automatic uploads directory creation
- 🚀 RESTful API endpoints

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd SplitSnap
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

## API Endpoints

### GET `/`
- **Description**: Home page with upload form
- **Response**: HTML page with drag-and-drop interface

### GET `/upload`
- **Description**: Upload page
- **Response**: HTML page for file uploads

### POST `/upload`
- **Description**: Handle file upload
- **Request**: Multipart form data with file
- **Response**: JSON response with upload status

#### Request Format:
```
Content-Type: multipart/form-data
Body: file=<file_data>
```

#### Response Format:
```json
{
  "message": "File uploaded successfully",
  "filename": "example.pdf",
  "filepath": "uploads/example.pdf"
}
```

## Configuration

The application can be configured by modifying the following settings in `app.py`:

- `UPLOAD_FOLDER`: Directory where uploaded files are stored (default: 'uploads')
- `MAX_CONTENT_LENGTH`: Maximum file size in bytes (default: 16MB)
- `ALLOWED_EXTENSIONS`: Set of allowed file extensions

## File Types Supported

- Text files: `.txt`
- PDF documents: `.pdf`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`
- Documents: `.doc`, `.docx`

## Security Features

- File type validation
- Filename sanitization using `secure_filename`
- File size limits
- Secure file storage in dedicated uploads directory

## Development

To run the application in development mode with auto-reload:

```bash
python app.py
```

The application will run on `http://localhost:5000` with debug mode enabled.

## Project Structure

```
SplitSnap/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── README.md          # Project documentation
├── templates/         # HTML templates
│   └── index.html     # Main upload page
└── uploads/           # Uploaded files directory (created automatically)
```

## License

This project is open source and available under the MIT License. 