'use client';

import { useState } from 'react';

export default function Home() {
  const [epsilon, setEpsilon] = useState(0.1);
  const [image, setImage] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [adversarialImage, setAdversarialImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{original: string, adversarial: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  // Test backend connection
  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/');
      const data = await response.json();
      setBackendStatus(`Connected: ${data.message || 'Backend OK'}`);
    } catch (error) {
      setBackendStatus('Disconnected - Start backend server');
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate adversarial example
  const generateAdversarial = async () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('epsilon', epsilon.toString());

    try {
      const response = await fetch('http://localhost:8000/generate-adversarial/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.adversarial_image) {
        setAdversarialImage(`data:image/png;base64,${data.adversarial_image}`);
      }
      
      if (data.predictions) {
        setPrediction({
          original: data.predictions.original || 'Unknown',
          adversarial: data.predictions.adversarial || 'Unknown'
        });
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Error generating adversarial example. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Run backend check on component mount
  useState(() => {
    checkBackend();
  });

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>FGSM Adversarial Attack Demo</h1>
        <p style={{ color: '#666' }}>Fast Gradient Sign Method for generating adversarial examples</p>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '10px',
          backgroundColor: backendStatus.includes('Connected') ? '#d4edda' : '#f8d7da',
          color: backendStatus.includes('Connected') ? '#155724' : '#721c24',
          borderRadius: '5px',
          display: 'inline-block'
        }}>
          Backend Status: {backendStatus}
          <button 
            onClick={checkBackend}
            style={{ 
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Check Again
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Column - Controls */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px', color: '#495057' }}>Controls</h2>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Attack Strength (Epsilon): {epsilon.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span>Weak (0)</span>
              <span>Strong (0.5)</span>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Upload MNIST Digit Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ width: '100%', padding: '10px' }}
            />
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '5px' }}>
              Upload a 28x28 grayscale image of a digit (0-9)
            </p>
          </div>

          <button
            onClick={generateAdversarial}
            disabled={loading || !image}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Generating...' : 'Generate Adversarial Example'}
          </button>

          {prediction && (
            <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
              <h3 style={{ marginBottom: '10px' }}>Predictions</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>Original:</strong>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    {prediction.original}
                  </div>
                </div>
                <div>
                  <strong>Adversarial:</strong>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                    {prediction.adversarial}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Images */}
        <div style={{ padding: '25px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
          <h2 style={{ marginBottom: '20px', color: '#495057' }}>Results</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Original Image */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '10px' }}>Original Image</h3>
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto',
                border: '2px dashed #adb5bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                {originalImage ? (
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : (
                  <span style={{ color: '#6c757d' }}>No image uploaded</span>
                )}
              </div>
            </div>

            {/* Adversarial Image */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '10px' }}>Adversarial Image</h3>
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto',
                border: '2px dashed #dc3545',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                {adversarialImage ? (
                  <img 
                    src={adversarialImage} 
                    alt="Adversarial" 
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : (
                  <span style={{ color: '#6c757d' }}>Not generated yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f1ff', borderRadius: '5px' }}>
            <h3 style={{ color: '#004085' }}>How FGSM Works:</h3>
            <p style={{ marginTop: '10px', lineHeight: '1.5' }}>
              The Fast Gradient Sign Method (FGSM) adds small perturbations to the input image 
              in the direction of the gradient of the loss function. These perturbations are 
              calculated as: <strong>perturbation = epsilon * sign(gradient)</strong>.
              Even though the changes are barely visible to humans, they can cause the model 
              to misclassify the image.
            </p>
          </div>
        </div>
      </div>

      <footer style={{ 
        marginTop: '50px', 
        textAlign: 'center', 
        padding: '20px',
        borderTop: '1px solid #dee2e6',
        color: '#6c757d'
      }}>
        <p>FGSM Adversarial Attack Demonstration | Backend: http://localhost:8000</p>
        <p>Upload MNIST digit images to see how adversarial attacks work</p>
      </footer>
    </div>
  );
}