export type CvSectionType = 'about' | 'experience' | 'skills' | 'education';

export interface CvSection {
  type: CvSectionType;
  order: number;
  layout?: 'default' | 'columns';
}

export interface CvStructure {
  header: {
    photoPosition: 'top' | 'left' | 'right';
    showName: boolean;
    showTitle: boolean;
  };
  sections: CvSection[];
}
