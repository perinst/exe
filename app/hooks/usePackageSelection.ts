import { useState, useCallback } from "react";
import { useLibrary } from "../context/LibraryContext";

export const usePackageSelection = () => {
  const {
    saveColorToPackage,
    savePaletteToPackage,
    showPackageSelector,
    setShowPackageSelector,
    pendingColorSave,
    setPendingColorSave,
    pendingPaletteSave,
    setPendingPaletteSave,
  } = useLibrary();

  const [selectionType, setSelectionType] = useState<
    "color" | "palette" | null
  >(null);
  const saveColorWithPackageSelection = useCallback(
    (
      color: string,
      name?: string,
      source?: "camera" | "gallery" | "picker"
    ) => {
      console.log(
        "usePackageSelection: saveColorWithPackageSelection called with:",
        { color, name, source }
      );
      setPendingColorSave?.({ color, name, source });
      setSelectionType("color");
      setShowPackageSelector?.(true);
      console.log("usePackageSelection: Package selector should be shown now");
    },
    [setPendingColorSave, setShowPackageSelector]
  );

  const savePaletteWithPackageSelection = useCallback(
    (palette: {
      name: string;
      colors: string[];
      scheme?: string;
      description?: string;
    }) => {
      setPendingPaletteSave?.(palette);
      setSelectionType("palette");
      setShowPackageSelector?.(true);
    },
    [setPendingPaletteSave, setShowPackageSelector]
  );
  const handlePackageSelected = useCallback(
    async (packageId: string) => {
      try {
        console.log(
          "usePackageSelection: handlePackageSelected called with packageId:",
          packageId
        );
        // console.log("usePackageSelection: selectionType:", selectionType);
        // console.log("usePackageSelection: pendingColorSave:", pendingColorSave);
        // console.log(
        //   "usePackageSelection: pendingPaletteSave:",
        //   pendingPaletteSave
        // );

        if (selectionType === "color" && pendingColorSave) {
          console.log("usePackageSelection: Saving color to package");
          await saveColorToPackage(
            pendingColorSave.color,
            packageId,
            pendingColorSave.name,
            pendingColorSave.source
          );
          setPendingColorSave?.(null);
        } else if (selectionType === "palette" && pendingPaletteSave) {
          //   console.log("usePackageSelection: Saving palette to package");
          await savePaletteToPackage(pendingPaletteSave, packageId);
          setPendingPaletteSave?.(null);
        }

        // console.log("usePackageSelection: Cleaning up selection state");
        setSelectionType(null);
        setShowPackageSelector?.(false);
      } catch (error) {
        console.error("Error saving to package:", error);
      }
    },
    [
      selectionType,
      pendingColorSave,
      pendingPaletteSave,
      saveColorToPackage,
      savePaletteToPackage,
      setPendingColorSave,
      setPendingPaletteSave,
      setShowPackageSelector,
    ]
  );

  const cancelPackageSelection = useCallback(() => {
    setPendingColorSave?.(null);
    setPendingPaletteSave?.(null);
    setSelectionType(null);
    setShowPackageSelector?.(false);
  }, [setPendingColorSave, setPendingPaletteSave, setShowPackageSelector]);

  const getSelectionTitle = useCallback(() => {
    switch (selectionType) {
      case "color":
        return "Save Color";
      case "palette":
        return "Save Palette";
      default:
        return "Select Package";
    }
  }, [selectionType]);

  const getSelectionSubtitle = useCallback(() => {
    switch (selectionType) {
      case "color":
        return "Choose a package to save this color";
      case "palette":
        return "Choose a package to save this palette";
      default:
        return "Choose where to save this item";
    }
  }, [selectionType]);

  return {
    saveColorWithPackageSelection,
    savePaletteWithPackageSelection,
    handlePackageSelected,
    cancelPackageSelection,
    showPackageSelector: showPackageSelector || false,
    selectionType,
    getSelectionTitle,
    getSelectionSubtitle,
    pendingColorSave,
    pendingPaletteSave,
  };
};
