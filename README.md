# The Crusher

Compresses video files for use on web

## Requirements
MacOS 12.5 or later

## Install

Download the latest .dmg release from:

https://github.com/chrishow/crusher/releases

It's huge, I know. This is due to it being an Electron app, and having a statically compiled build of FFmepg embedded in it.


Double-click the downloaded file.  

Drag the app 'the-crusher' into your Applications folder (or whereever you want to keep it)  

## Running
Double-click the app. The first time you run it, you will get a warning:

![image](https://github.com/user-attachments/assets/641153ff-2466-48b4-a5d5-ca937b04e172)

Click 'open'.

Choose a file to compress. The file should be an mp4. You can either drag a file onto the file field, or click the 'Choose file' button and select it from the file dialog. 


Once you've chosen a file, you should see the compress screen:

<img width="641" alt="image" src="https://github.com/user-attachments/assets/1182f7c7-ebb7-4d23-9cb8-423ce8302316">

You can only generate files at the same or lower resolution than the original mp4, so higher resolutions may be disabled. 

Before starting the compression, choose an output folder by clicking the 'Choose' link. This is where your converted files will be stored. The app will remember this, so you only have to do it the first time, or if you change where you want to store the output files. 

I suggest choosing your 'Downloads' folder. 

Click on 'Crush files'. 

The compressed files will be stored in your output folder, with a name suffix showing the resolution of the compressed file, one of:

1. '-crushed-2160p.mp4'
2. '-crushed-1080p.mp4'
3. '-crushed-720p.mp4'

Click 'Start over' to compress a new file. 
