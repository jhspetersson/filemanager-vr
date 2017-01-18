# File Manager VR
File manager with A-Frame UI and Jetty backend. Works with FF nightly build and HTC Vive.

![](https://github.com/jhspetersson/filemanager-vr/blob/master/screenshots/2.png)
![](https://github.com/jhspetersson/filemanager-vr/blob/master/screenshots/4.png)
![](https://github.com/jhspetersson/filemanager-vr/blob/master/screenshots/6.png)

## Idea

This project is an attempt to build a more or less universal VR environment or shell for browsing tree-style data (like file systems with files and folders) and running applications which could be downloaded and executed separately but in one uniform interactive 3D space. These applications could exchange visual data with each other and are subject to various manipulations.

Such a shell could be used as

* shell for a system administrator or operator
* reporting dashboard for business intelligence suite or data analytics

## Implementation state

Current state is nearly a draft, but quite functional, and actually is used by me on a daily basis (for sorting photos and misc stuff on remote file storages).

## Features

* browse file systems
* move files and directories
* preview JPEG and PNG images
* visualize OLAP cubes from prepared CSV files

## Controls

* select and click with trigger to open directory or file
* grab a file and put to directory box, so you move a real file to new destination directory
* rotate and resize files, directories, and OLAP cubes
* grip button to move up

## Technical description

This app consists of two parts: frontend built with A-Frame framework and backend implemented as Spring MVC service with embedded Jetty web-server. However both parts could be replaced with something else as long as simple JSON-based exchange protocol is supported.

## Installation and running

Install [Java 8](https://www.java.com)

Download [Firefox nightly build](https://nightly.mozilla.org/)

Enable OpenVR support in FF nightly: https://blog.mozvr.com/experimental-htc-vive-support-in-firefox-nightly/

Run jar-file either by doubleclicking or from command line:

> java -jar filemanager-vr.jar

Go to http://localhost:10101 and enter VR.

Copy CSV file from examples to the real directory to test OLAP cubes visualization.
