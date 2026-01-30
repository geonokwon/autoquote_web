import React from 'react';
import SectionWrapper from './SectionWrapper.jsx';
import ServiceButtonGrid from './ServiceButtonGrid.jsx';

export default function GenericSection({
  title,
  serviceKeys = [],
  selectedOptions = {},
  onOpenDialog,
  extraHeader,
  buttonColor = 'primary',
  services // optional override
}) {
  return (
    <SectionWrapper title={title} extraHeader={extraHeader}>
      <ServiceButtonGrid
        serviceKeys={serviceKeys}
        selectedOptions={selectedOptions}
        onOpenDialog={onOpenDialog}
        buttonColor={buttonColor}
        services={services}
      />
    </SectionWrapper>
  );
} 