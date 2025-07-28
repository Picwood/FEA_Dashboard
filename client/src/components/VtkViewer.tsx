import { useEffect, useRef, useState } from "react";
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
import vtkLookupTable from "@kitware/vtk.js/Common/Core/LookupTable";
import vtkScalarBarActor from "@kitware/vtk.js/Rendering/Core/ScalarBarActor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface VtkViewerProps {
  vtkFilePath?: string;
  className?: string;
}

export default function VtkViewer({ vtkFilePath, className = "" }: VtkViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullScreenRendererRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize VTK using FullScreenRenderWindow - more reliable approach
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    try {
      console.log("Initializing VTK with FullScreenRenderWindow...");
      
      // Use FullScreenRenderWindow which handles canvas creation automatically
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: containerRef.current,
        containerStyle: {
          height: '100%',
          width: '100%',
          position: 'relative'
        }
      });

      fullScreenRendererRef.current = fullScreenRenderer;
      setIsInitialized(true);
      console.log("VTK initialized successfully");

    } catch (err) {
      console.error('Failed to initialize VTK:', err);
      setError('Failed to initialize 3D viewer');
    }

    return () => {
      if (fullScreenRendererRef.current) {
        try {
          console.log("Cleaning up VTK...");
          fullScreenRendererRef.current.delete();
          fullScreenRendererRef.current = null;
        } catch (cleanupError) {
          console.warn("Error during cleanup:", cleanupError);
        }
      }
      setIsInitialized(false);
    };
  }, []);

  // Load VTK file when path changes
  useEffect(() => {
    if (vtkFilePath && isInitialized && fullScreenRendererRef.current) {
      loadVtkFile(vtkFilePath);
    }
  }, [vtkFilePath, isInitialized]);

  const loadTestFile = async () => {
    if (!isInitialized || !fullScreenRendererRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try different possible filenames
      const testFiles = ['Bunny.vtp', 'bunny.vtp', 'rabbit.vtp'];
      let response;
      let lastError;

      for (const filename of testFiles) {
        try {
          response = await fetch(`/api/test-vtk/${filename}`, {
            credentials: 'include'
          });
          if (response.ok) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to load test file. Please ensure Bunny.vtp exists in C:/Users/PC/Downloads/. ${lastError ? `Last error: ${lastError}` : ''}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await processVtkData(arrayBuffer);
    } catch (err) {
      console.error('Error loading test file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test file');
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVtkFile = async (filePath: string) => {
    if (!isInitialized || !fullScreenRendererRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/${filePath}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load VTK file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await processVtkData(arrayBuffer);
    } catch (err) {
      console.error('Error loading VTK file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VTK file');
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const processVtkData = async (arrayBuffer: ArrayBuffer) => {
    if (!fullScreenRendererRef.current) return;

    try {
      const renderer = fullScreenRendererRef.current.getRenderer();
      const renderWindow = fullScreenRendererRef.current.getRenderWindow();

      // Use XMLPolyDataReader for .vtp files
      const reader = vtkXMLPolyDataReader.newInstance();
      reader.parseAsArrayBuffer(arrayBuffer);
      const source = reader.getOutputData();

      if (!source) {
        throw new Error('Failed to parse VTK file. Currently only .vtp files are supported.');
      }

      // Clear previous actors
      const actors = renderer.getActors();
      actors.forEach((actor: any) => {
        renderer.removeActor(actor);
      });

      // Create mapper and actor
      const mapper = vtkMapper.newInstance();
      mapper.setInputData(source);

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);

      // Check for scalar data and apply color mapping
      const pointData = source.getPointData();
      if (pointData && pointData.getNumberOfArrays() > 0) {
        const scalars = pointData.getScalars();
        if (scalars) {
          const range = scalars.getRange();
          
          // Create lookup table for color mapping
          const lookupTable = vtkLookupTable.newInstance();
          lookupTable.setRange(range[0], range[1]);
          lookupTable.setHueRange([0.67, 0.0]); // Blue to red
          lookupTable.build();
          
          mapper.setLookupTable(lookupTable);
          mapper.setScalarRange(range[0], range[1]);
          mapper.setScalarModeToUsePointData();
          mapper.setScalarVisibility(true);

          // Add scalar bar
          const scalarBarActor = vtkScalarBarActor.newInstance();
          scalarBarActor.setScalarsToColors(lookupTable);
          renderer.addActor(scalarBarActor);
        }
      }

      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();

      setHasData(true);
      setError(null);
      console.log("VTK data processed successfully");
    } catch (err) {
      console.error("Error processing VTK data:", err);
      throw err;
    }
  };

  const resetCamera = () => {
    try {
      if (fullScreenRendererRef.current && isInitialized) {
        const renderer = fullScreenRendererRef.current.getRenderer();
        const renderWindow = fullScreenRendererRef.current.getRenderWindow();
        renderer.resetCamera();
        renderWindow.render();
      }
    } catch (error) {
      console.warn("Error resetting camera:", error);
    }
  };

  const zoomIn = () => {
    try {
      if (fullScreenRendererRef.current && isInitialized) {
        const renderer = fullScreenRendererRef.current.getRenderer();
        const renderWindow = fullScreenRendererRef.current.getRenderWindow();
        const camera = renderer.getActiveCamera();
        camera.zoom(1.2);
        renderWindow.render();
      }
    } catch (error) {
      console.warn("Error zooming in:", error);
    }
  };

  const zoomOut = () => {
    try {
      if (fullScreenRendererRef.current && isInitialized) {
        const renderer = fullScreenRendererRef.current.getRenderer();
        const renderWindow = fullScreenRendererRef.current.getRenderWindow();
        const camera = renderer.getActiveCamera();
        camera.zoom(0.8);
        renderWindow.render();
      }
    } catch (error) {
      console.warn("Error zooming out:", error);
    }
  };

  const resetView = () => {
    try {
      if (fullScreenRendererRef.current && isInitialized) {
        const renderer = fullScreenRendererRef.current.getRenderer();
        const renderWindow = fullScreenRendererRef.current.getRenderWindow();
        const camera = renderer.getActiveCamera();
        camera.setPosition(1, 1, 1);
        camera.setViewUp(0, 0, 1);
        renderer.resetCamera();
        renderWindow.render();
      }
    } catch (error) {
      console.warn("Error resetting view:", error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          3D Visualization
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={!hasData || !isInitialized}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={!hasData || !isInitialized}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetCamera} disabled={!hasData || !isInitialized}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView} disabled={!hasData || !isInitialized}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={loadTestFile} disabled={!isInitialized} className="ml-2">
              Test Bunny
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          className="w-full h-96 bg-gray-900 rounded-lg relative overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
              <div className="text-white">Loading 3D model...</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-red-400 text-center">
                <p>Error loading 3D model:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          {!vtkFilePath && !isLoading && !isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-gray-400 text-center">
                <p>Initializing 3D viewer...</p>
              </div>
            </div>
          )}
          {!vtkFilePath && !isLoading && isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-gray-400 text-center">
                <p>No VTK file selected</p>
                <p className="text-sm">Upload a VTK file (.vtp format) to visualize simulation results</p>
              </div>
            </div>
          )}
        </div>
        {hasData && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Use mouse to interact: Left-click and drag to rotate, scroll to zoom, right-click and drag to pan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 