package aframe.fm.server.controller;

import aframe.fm.server.model.FileNode;
import aframe.fm.server.service.FileNodeService;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.nio.file.AccessDeniedException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@SuppressWarnings("UnusedDeclaration")
public class IndexController {

    @Autowired
    private ServletContext servletContext;

    @Autowired
    private FileNodeService service;

    @RequestMapping("/")
    @ResponseBody
    public String showIndex() {
        return new BufferedReader(new InputStreamReader(servletContext.getResourceAsStream("/index.html")))
                .lines().collect(Collectors.joining("\n"));
    }

    @RequestMapping("/ls")
    @ResponseBody
    public FileListResult getFileList(@RequestParam(required = false, defaultValue = "") String root) {
        if (root.endsWith(":")) {
            root += "\\";
        }
        Path rootPath = root.isEmpty() ? null : Paths.get(root);
        FileListResult fileListResult = new FileListResult();

        try {
            fileListResult.setData(service.getFileList(rootPath));
        } catch (AccessDeniedException e) {
            fileListResult.setError("Access denied");
            e.printStackTrace();
        } catch (Exception e) {
            fileListResult.setError(e.getMessage());
            e.printStackTrace();
        }

        return fileListResult;
    }

    class FileListResult {
        String error;
        List<FileNode> data;

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public List<FileNode> getData() {
            return data;
        }

        public void setData(List<FileNode> data) {
            this.data = data;
        }
    }

    @RequestMapping("/move")
    @ResponseBody
    public Map<String, Object> move(@RequestParam String source,
                     @RequestParam String destination) {
        Map<String, Object> result = new HashMap<>();

        try {
            FileUtils.moveToDirectory(new File(source), new File(destination), false);
            result.put("success", true);
        } catch (IOException e) {
            result.put("error", e.getMessage());
            e.printStackTrace();
        }

        return result;
    }

    @RequestMapping("/img")
    public void getImage(@RequestParam String name,
                         HttpServletResponse response) throws IOException {
        response.setContentType("image/jpeg");
        Thumbnails.of(name)
                .width(1024)
                .outputFormat("jpg")
                .toOutputStream(response.getOutputStream());
    }

    @RequestMapping("/cube")
    @ResponseBody
    public Map<String, List> getCubeData(@RequestParam String name) throws IOException {
        Map<String, List> result = new LinkedHashMap<>();
        List<String> columns = new ArrayList<>();
        List<List<String>> data = new ArrayList<>();
        result.put("columns", columns);
        result.put("data", data);

        Reader in = new FileReader(name);
        Iterable<CSVRecord> records = CSVFormat.DEFAULT.parse(in);
        for (CSVRecord record : records) {
            if (columns.isEmpty()) {
                for (String column : record) {
                    columns.add(column);
                }
            } else {
                List<String> values = new ArrayList<>();
                for (String value : record) {
                    values.add(value);
                }
                data.add(values);
            }
        }

        return result;
    }
}
