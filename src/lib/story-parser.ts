const detectCharacters = (line: string): string[] => {
  const lowerLine = line.toLowerCase();
  const detected: string[] = [];

  if (lowerLine.includes('boy')) detected.push('boy');
  if (lowerLine.includes('girl')) detected.push('girl');
  if (lowerLine.includes('knight')) detected.push('Brave Knight');
  if (lowerLine.includes('wizard')) detected.push('Wise Wizard');
  if (lowerLine.includes('explorer')) detected.push('Space Explorer');
  if (lowerLine.includes('hacker')) detected.push('Cyberpunk Hacker');

  if (detected.length === 0) {
    return ['default'];
  }
  return [...new Set(detected)]; // Return unique characters
}

const detectBackground = (line: string): string => {
  const lowerLine = line.toLowerCase();

  if (lowerLine.includes('forest')) return 'Enchanted Forest';
  if (lowerLine.includes('city')) return 'Futuristic Cityscape';
  if (lowerLine.includes('castle')) return 'Castle Interior';
  if (lowerLine.includes('school')) return 'school';

  return 'default';
}

const parseStoryToScenes = (story: string) => {
  const sentences = story.split('.').filter(s => s.trim().length > 0);
  const scenes = sentences.map((line, index) => ({
    id: `scene-${index}`,
    text: line.trim(),
    characters: detectCharacters(line),
    background: detectBackground(line),
  }));

  return scenes;
}

export const StoryParser = {
    parseStoryToScenes
};
