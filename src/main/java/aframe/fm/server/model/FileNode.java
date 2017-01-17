package aframe.fm.server.model;

public class FileNode {
    private String name;
    private String type;
    private String path;
    private long size;

    public FileNode(String name, String type, String path, long size) {
        this.name = name;
        this.type = type;
        this.path = path;
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}
