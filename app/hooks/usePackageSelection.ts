import { useState, useCallback } from "react";
import { useLibrary } from "../context/LibraryContext";

export const usePackageSelection = () => {
  const {
    saveColorToPackage,
    savePaletteToPackage,
    showPackageSelector,
    setShowPackageSelector,
    selectionType,
    setSelectionType,
    pendingColorSave,
    setPendingColorSave,
    pendingPaletteSave,
    setPendingPaletteSave,
  } = useLibrary();
  const saveColorWithPackageSelection = useCallback(
    (
      color: string,
      name?: string,
      source?: "camera" | "gallery" | "picker"
    ) => {
      // console.log(
      //   "usePackageSelection: saveColorWithPackageSelection called with:",
      //   { color, name, source }
      // );

      setPendingColorSave?.({ color, name, source });
      setSelectionType?.("color");
      setShowPackageSelector?.(true);

      // console.log(
      //   "usePackageSelection: State set - selectionType should be 'color'"
      // );
    },
    [setPendingColorSave, setSelectionType, setShowPackageSelector]
  );
  const savePaletteWithPackageSelection = useCallback(
    (palette: {
      name: string;
      colors: string[];
      scheme?: string;
      description?: string;
    }) => {
      setPendingPaletteSave?.(palette);
      setSelectionType?.("palette");
      setShowPackageSelector?.(true);
    },
    [setPendingPaletteSave, setSelectionType, setShowPackageSelector]
  );
  const handlePackageSelected = async (packageId: string) => {
    try {
      if (selectionType === "color" && pendingColorSave) {
        await saveColorToPackage(
          pendingColorSave.color,
          packageId,
          pendingColorSave.name,
          pendingColorSave.source
        );
        setPendingColorSave?.(null);
      } else if (selectionType === "palette" && pendingPaletteSave) {
        await savePaletteToPackage(pendingPaletteSave, packageId);
        setPendingPaletteSave?.(null);
      } else {
        console.log("No valid selection found:", {
          selectionType,
          hasPendingColorSave: !!pendingColorSave,
          hasPendingPaletteSave: !!pendingPaletteSave,
        });
      }
    } catch (error) {
      console.error("Error saving to package:", error);
    } finally {
      setSelectionType?.(null);
      setShowPackageSelector?.(false);
    }
  };

  const cancelPackageSelection = useCallback(() => {
    setPendingColorSave?.(null);
    setPendingPaletteSave?.(null);
    setSelectionType?.(null);
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
