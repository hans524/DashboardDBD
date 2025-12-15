from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model_logic import process_clustering
import uvicorn

app = FastAPI()

# Izinkan Frontend mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/clustering/{tahun}")
async def get_data(tahun: str):
    try:
        results = process_clustering(tahun)
        return {"status": "success", "tahun": tahun, "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)