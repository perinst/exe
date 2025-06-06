import React from "react";
import PackageSelector from "../components/PackageSelector";
import { usePackageSelection } from "../hooks/usePackageSelection";

interface LibraryPackageSelectorProps {
  children?: React.ReactNode;
}

const LibraryPackageSelector: React.FC<LibraryPackageSelectorProps> = ({
  children,
}) => {
  const {
    showPackageSelector,
    handlePackageSelected,
    cancelPackageSelection,
    getSelectionTitle,
    getSelectionSubtitle,
  } = usePackageSelection();

  return (
    <>
      {children}
      <PackageSelector
        visible={showPackageSelector}
        onClose={cancelPackageSelection}
        onSelectPackage={handlePackageSelected}
        title={getSelectionTitle()}
        subtitle={getSelectionSubtitle()}
      />
    </>
  );
};

export default LibraryPackageSelector;
