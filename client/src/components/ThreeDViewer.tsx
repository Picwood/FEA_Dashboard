import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ThreeDViewerProps {
  selectedComponents: string[];
  onComponentSelect: (componentId: string) => void;
  onComponentDeselect: (componentId: string) => void;
}

export default function ThreeDViewer({ 
  selectedComponents, 
  onComponentSelect, 
  onComponentDeselect 
}: ThreeDViewerProps) {
  const handleComponentToggle = (componentId: string) => {
    if (selectedComponents.includes(componentId)) {
      onComponentDeselect(componentId);
    } else {
      onComponentSelect(componentId);
    }
  };

  const clearSelection = () => {
    selectedComponents.forEach(componentId => onComponentDeselect(componentId));
  };

  const selectAll = () => {
    const allComponents = ["lower_monolith", "crown", "stanchion_left", "stanchion_right", "steerer"];
    allComponents.forEach(componentId => {
      if (!selectedComponents.includes(componentId)) {
        onComponentSelect(componentId);
      }
    });
  };

  // Simulated component data
  const components = [
    { id: "lower_monolith", name: "Lower Monolith" },
    { id: "crown", name: "Crown" },
    { id: "stanchion_left", name: "Left Stanchion" },
    { id: "stanchion_right", name: "Right Stanchion" },
    { id: "steerer", name: "Steerer" },
  ];

  return (
    <div className="w-full h-96 bg-gray-50 rounded-lg border relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-64 h-48 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <div className="text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">3D Fork Model Placeholder</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            {components.map((component) => {
              const isSelected = selectedComponents.includes(component.id);
              return (
                <Button
                  key={component.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleComponentToggle(component.id)}
                  className="text-xs"
                >
                  {component.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 space-y-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
          Clear
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4">
        <div className="bg-white rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-medium text-sm mb-2">Selected Components:</h4>
          {selectedComponents.length === 0 ? (
            <p className="text-gray-500 text-xs">Click on components to select them</p>
          ) : (
            <div className="space-y-1">
              {selectedComponents.map(component => (
                <div key={component} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {component.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
