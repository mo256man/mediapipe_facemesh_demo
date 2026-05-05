import { useState } from 'react';
import Header from './components/Header'
import Mp from './components/Mp'
import FaceMeshViewer from './components/FaceMeshViewer'

function App() {
  const [showTexure, setShowTexure] = useState(true);
  const [sourceType, setSourceType] = useState("none");
  const [textureImage, setTextureImage] = useState("/mask_sample.png");
  const [imageSource, setImageSource] = useState("/image_sample.jpg");
  const [videoSource, setVideoSource] = useState("/movie_sample.mov");

  return (
    <>
      <Header showTexure={showTexure} setShowTexure={setShowTexure} sourceType={sourceType} setSourceType={setSourceType} textureImage={textureImage} setTextureImage={setTextureImage} imageSource={imageSource} setImageSource={setImageSource} videoSource={videoSource} setVideoSource={setVideoSource} />
      <div className="main">
        <FaceMeshViewer showTexure={showTexure} sourceType={sourceType} textureImage={textureImage} imageSource={imageSource} videoSource={videoSource} />
      </div>
    </>
  )
}

export default App
