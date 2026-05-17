import { useState, useEffect } from 'react';
import Menu from './components/Menu'
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
  const [selectedObjFile, setSelectedObjFile] = useState(
    textureFiles[0]?.obj || "canonical_face_model.obj"
  );
  const [selectedObjScale, setSelectedObjScale] = useState(
    textureFiles[0]?.scale ?? 1.0
  );
  const [smoothShading, setSmoothShading] = useState(false);

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

  const resizeImageOnCanvas = (source, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        const aspectRatio = width / height;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = source;
    });
  };

  const generateVideoThumbnail = (videoPath) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoPath;
      video.crossOrigin = "anonymous";
      
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = video.duration * 0.1;
      });
      
      video.addEventListener('seeked', () => {
        const maxWidth = 200;
        const maxHeight = 160;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        const aspectRatio = width / height;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      }, { once: true });
    });
  };

  const [imageFilesWithThumbnails, setImageFilesWithThumbnails] = useState([]);
  const [textureFilesWithThumbnails, setTextureFilesWithThumbnails] = useState([]);

  useEffect(() => {
    const generateImageThumbnails = async () => {
      const imagesWithThumbnails = await Promise.all(
        imageFiles.map(async (item) => {
          const imagePath = basePath + imageFolder + "/" + item.filename;
          const thumbnail = await resizeImageOnCanvas(imagePath, 200, 160);
          return {
            ...item,
            thumbnail: thumbnail
          };
        })
      );
      setImageFilesWithThumbnails(imagesWithThumbnails);
    };
    
    if (imageFiles.length > 0) {
      generateImageThumbnails();
    }
  }, [imageFiles, basePath, imageFolder]);

  useEffect(() => {
    const generateTextureThumbnails = async () => {
      const texturesWithThumbnails = await Promise.all(
        textureFiles.map(async (item) => {
          const texturePath = basePath + textureFolder + "/" + item.filename;
          const thumbnail = await resizeImageOnCanvas(texturePath, 200, 160);
          return {
            ...item,
            thumbnail: thumbnail
          };
        })
      );
      setTextureFilesWithThumbnails(texturesWithThumbnails);
    };
    
    if (textureFiles.length > 0) {
      generateTextureThumbnails();
    }
  }, [textureFiles, basePath, textureFolder]);

  return (
    <>
      <Menu showTexure={showTexure} setShowTexure={setShowTexure} sourceType={sourceType} setSourceType={setSourceType} textureImage={textureImage} setTextureImage={setTextureImage} imageSource={imageSource} setImageSource={setImageSource} videoSource={videoSource} setVideoSource={setVideoSource} textureFiles={textureFilesWithThumbnails} textureFolder={textureFolder} imageFiles={imageFilesWithThumbnails} imageFolder={imageFolder} videoFiles={videoFilesWithThumbnails} videoFolder={videoFolder} thumbnailFolder={thumbnailFolder} basePath={basePath} editMode={editMode} setEditMode={setEditMode} savedImages={savedImages} setSavedImages={setSavedImages} importedTextures={importedTextures} setImportedTextures={setImportedTextures} importedImages={importedImages} setImportedImages={setImportedImages} importedVideos={importedVideos} setImportedVideos={setImportedVideos} captureMode={captureMode} setCaptureMode={setCaptureMode} selectedObjFile={selectedObjFile} setSelectedObjFile={setSelectedObjFile} selectedObjScale={selectedObjScale} setSelectedObjScale={setSelectedObjScale} smoothShading={smoothShading} setSmoothShading={setSmoothShading} />
      <div className="header-title" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", cursor: "pointer" }}>
        MediaPipe FaceMesh Demo
      </div>
      <div className="main" style={{ display: "flex", flexDirection: "row" }}>
        {!editMode && !captureMode && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} drawCanvas={drawCanvasEl} selectedObjFile={selectedObjFile} objScale={selectedObjScale} smoothShading={smoothShading} />
          </div>
        )}
        {editMode && !captureMode && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} drawCanvas={drawCanvasEl} selectedObjFile={selectedObjFile} objScale={selectedObjScale} smoothShading={smoothShading} />
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
