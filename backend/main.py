"""
CutCam Backend - FastAPI + rembg (background removal)

Run on local PC:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000

The smartphone PWA on the same LAN can then call this server
for background removal processing.
"""

import io
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image
from rembg import remove

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CutCam Backend", version="0.1.0")

# Allow all origins for LAN use (smartphone → PC)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "cutcam-backend"}


@app.post("/api/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """
    Accept an image file, remove its background using rembg,
    and return the result as a PNG with transparency.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        input_image = Image.open(io.BytesIO(contents)).convert("RGBA")

        logger.info(
            "Processing image: %s (%dx%d)",
            file.filename,
            input_image.width,
            input_image.height,
        )

        # rembg handles the ONNX inference internally
        output_image = remove(input_image)

        # Encode result as PNG
        buf = io.BytesIO()
        output_image.save(buf, format="PNG")
        buf.seek(0)

        logger.info("Background removal complete for: %s", file.filename)

        return Response(
            content=buf.getvalue(),
            media_type="image/png",
            headers={"Content-Disposition": f"inline; filename=cutout_{file.filename}"},
        )

    except Exception as e:
        logger.exception("Error processing image")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
