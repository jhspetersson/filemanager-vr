package aframe.fm.server.service;

import aframe.fm.server.model.FileNode;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FileNodeService {
    public List<FileNode> getFileList(Path root) throws IOException {
        if (root == null) {
            return getRootList();
        }

        return Files.list(root)
                .sorted((a, b) -> {
                    if (Files.isDirectory(a) && !Files.isDirectory(b)) {
                        return -1;
                    } else if (!Files.isDirectory(a) && Files.isDirectory(b)) {
                        return 1;
                    } else {
                        return a.compareTo(b);
                    }
                })
                .map(f -> new FileNode(f.getName(f.getNameCount() - 1).toString(),
                        getType(f), f.toAbsolutePath().toString(),
                        f.toFile().length()))
                .collect(Collectors.toList());
    }

    private List<FileNode> getRootList() {
        return Stream.of(File.listRoots())
                .sorted()
                .map(f -> new FileNode(f.toString(), "dir", f.toString(), 0))
                .collect(Collectors.toList());
    }

    private String getType(Path path) {
        if (Files.isDirectory(path)) {
            return "dir";
        }

        if (path.toString().endsWith(".cube.csv")) {
            return "cube";
        }

        String[] parts = path.toString().toLowerCase().split("\\.");
        String ext = parts[parts.length - 1];

        switch (ext) {
            case "jpg":
            case "png":
                return "img";

                default:
                    return "";
        }
    }
}
