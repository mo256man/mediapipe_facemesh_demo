import { useState, useEffect } from 'react';
import Header from './components/Header'
import FaceMeshViewer from './components/FaceMeshViewer'
import Draw from './components/Draw'
import FaceCapture from './components/FaceCapture'
import TextureBuilder from './components/TextureBuilder'
import samplesData from './components/samples.json'

function App() {
  const basePath = import.meta.env.BASE_URL;
  const imageFolder = "image";
  const videoFolder = "video";
  const thumbnailFolder = "thumbnail";
  const textureFolder = "texture";
  
  const textureFiles = samplesData.texture || [];
  const imageFiles = samplesData.iamge || [];
  const videoFiles = samplesData.video || [];
  
  const [showTexure, setShowTexure] = useState(true);
  const [sourceType, setSourceType] = useState("none");
  const [textureImage, setTextureImage] = useState(() => 
    textureFiles[0] ? basePath + textureFolder + "/" + textureFiles[0].filename : ""
  );
  const [imageSource, setImageSource] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [drawCanvasEl, setDrawCanvasEl] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [importedTextures, setImportedTextures] = useState([]);
  const [importedImages, setImportedImages] = useState([]);
  const [importedVideos, setImportedVideos] = useState([]);
  const [videoFilesWithThumbnails, setVideoFilesWithThumbnails] = useState([]);
  const [captureMode, setCaptureMode] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);

  useEffect(() => {
    const generateThumbnails = async () => {
      const videosWithThumbnails = await Promise.all(
        videoFiles.map(async (item) => {
          const videoPath = basePath + videoFolder + "/" + item.filename;
          const thumbnail = await generateVideoThumbnail(videoPath);
          return {
            ...item,
            thumbnail: thumbnail
          };
        })
      );
      setVideoFilesWithThumbnails(videosWithThumbnails);
    };
    
    if (videoFiles.length > 0) {
      generateThumbnails();
    }
  }, [videoFiles, basePath, videoFolder]);

  const generateVideoThumbnail = (videoPath) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoPath;
      video.crossOrigin = "anonymous";
      
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = video.duration * 0.1;
      });
      
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }, { once: true });
    });
  };

  return (
    <>
      <Header showTexure={showTexure} setShowTexure={setShowTexure} sourceType={sourceType} setSourceType={setSourceType} textureImage={textureImage} setTextureImage={setTextureImage} imageSource={imageSource} setImageSource={setImageSource} videoSource={videoSource} setVideoSource={setVideoSource} textureFiles={textureFiles} textureFolder={textureFolder} imageFiles={imageFiles} imageFolder={imageFolder} videoFiles={videoFilesWithThumbnails} videoFolder={videoFolder} thumbnailFolder={thumbnailFolder} basePath={basePath} editMode={editMode} setEditMode={setEditMode} savedImages={savedImages} setSavedImages={setSavedImages} importedTextures={importedTextures} setImportedTextures={setImportedTextures} importedImages={importedImages} setImportedImages={setImportedImages} importedVideos={importedVideos} setImportedVideos={setImportedVideos} captureMode={captureMode} setCaptureMode={setCaptureMode} />
      <div className="main" style={{ display: "flex", flexDirection: "row" }}>
        {!editMode && !captureMode && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} drawCanvas={drawCanvasEl} />
          </div>
        )}
        {editMode && !captureMode && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} drawCanvas={drawCanvasEl} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Draw ref={setDrawCanvasEl} savedImages={savedImages} setSavedImages={setSavedImages} />
            </div>
          </>
        )}
        {captureMode && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FaceCapture capturedFrames={capturedFrames} setCapturedFrames={setCapturedFrames} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TextureBuilder capturedFrames={capturedFrames} onTextureBuilt={(url) => { setTextureImage(url); setCaptureMode(false); }} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default App
