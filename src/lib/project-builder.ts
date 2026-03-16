import { StoryParser } from "./story-parser";

const buildProjectFromStory = (story: string) => {

  const scenes = StoryParser.parseStoryToScenes(story)

  return scenes.map((scene, index) => ({
    id: index,
    background: scene.background,
    characters: scene.characters,
    text: scene.text,
    duration: 10
  }))
}

export const ProjectBuilder = {
    buildProjectFromStory
}
