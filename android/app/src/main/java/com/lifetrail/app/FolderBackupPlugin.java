package com.lifetrail.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/*
Lets the app keep backup files in a folder the person picks, using Android's
own folder picker. The folder is remembered across restarts. Uses only the
framework DocumentsContract API, so it needs no extra libraries.
*/
@CapacitorPlugin(name = "FolderBackup")
public class FolderBackupPlugin extends Plugin {

    private static final int RW = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(RW | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, intent, "pickFolderResult");
    }

    @ActivityCallback
    private void pickFolderResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        Intent data = result.getData();
        JSObject out = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            out.put("cancelled", true);
            call.resolve(out);
            return;
        }
        Uri tree = data.getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(tree, RW);
        } catch (SecurityException e) {
            call.reject("Android would not let Life Trail keep access to that folder. Pick a different one.");
            return;
        }
        out.put("cancelled", false);
        out.put("uri", tree.toString());
        out.put("name", folderName(tree));
        call.resolve(out);
    }

    @PluginMethod
    public void checkFolder(PluginCall call) {
        String uri = call.getString("uri");
        JSObject out = new JSObject();
        out.put("granted", uri != null && hasWriteAccess(Uri.parse(uri)));
        call.resolve(out);
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String uriText = call.getString("uri");
        String name = call.getString("name");
        String data = call.getString("data");
        if (uriText == null || name == null || data == null) {
            call.reject("The folder, file name or contents are missing.");
            return;
        }
        Uri tree = Uri.parse(uriText);
        if (!hasWriteAccess(tree)) {
            call.reject("Life Trail no longer has access to the backup folder. Choose it again.");
            return;
        }
        try {
            ContentResolver resolver = getContext().getContentResolver();
            String parentId = DocumentsContract.getTreeDocumentId(tree);
            Uri parent = DocumentsContract.buildDocumentUriUsingTree(tree, parentId);
            Uri target = findChild(resolver, tree, parentId, name);
            if (target == null) {
                target = DocumentsContract.createDocument(resolver, parent, "application/json", name);
            }
            if (target == null) {
                call.reject("Could not create the backup file in that folder.");
                return;
            }
            try (OutputStream stream = resolver.openOutputStream(target, "wt")) {
                if (stream == null) {
                    call.reject("Could not open the backup file for writing.");
                    return;
                }
                stream.write(data.getBytes(StandardCharsets.UTF_8));
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not save the backup: " + e.getMessage(), e);
        }
    }

    /* Keeps the newest files whose names match the pattern and deletes the rest. */
    @PluginMethod
    public void pruneFiles(PluginCall call) {
        String uriText = call.getString("uri");
        String pattern = call.getString("pattern");
        Integer keep = call.getInt("keep", 30);
        if (uriText == null || pattern == null || keep == null) {
            call.reject("The folder or the pattern is missing.");
            return;
        }
        Uri tree = Uri.parse(uriText);
        if (!hasWriteAccess(tree)) {
            call.resolve();
            return;
        }
        try {
            ContentResolver resolver = getContext().getContentResolver();
            String parentId = DocumentsContract.getTreeDocumentId(tree);
            Pattern matcher = Pattern.compile(pattern);
            List<String[]> files = new ArrayList<>();
            Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parentId);
            String[] columns = {
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME
            };
            try (Cursor cursor = resolver.query(children, columns, null, null, null)) {
                while (cursor != null && cursor.moveToNext()) {
                    String id = cursor.getString(0);
                    String name = cursor.getString(1);
                    if (name != null && matcher.matcher(name).matches()) {
                        files.add(new String[] { name, id });
                    }
                }
            }
            Collections.sort(files, (a, b) -> b[0].compareTo(a[0]));
            for (int i = keep; i < files.size(); i++) {
                DocumentsContract.deleteDocument(resolver, DocumentsContract.buildDocumentUriUsingTree(tree, files.get(i)[1]));
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not tidy old backups: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void releaseFolder(PluginCall call) {
        String uri = call.getString("uri");
        if (uri != null) {
            try {
                getContext().getContentResolver().releasePersistableUriPermission(Uri.parse(uri), RW);
            } catch (Exception ignored) {
                // Nothing to release.
            }
        }
        call.resolve();
    }

    private boolean hasWriteAccess(Uri tree) {
        for (android.content.UriPermission permission : getContext().getContentResolver().getPersistedUriPermissions()) {
            if (permission.getUri().equals(tree) && permission.isWritePermission()) {
                return true;
            }
        }
        return false;
    }

    private Uri findChild(ContentResolver resolver, Uri tree, String parentId, String name) {
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parentId);
        String[] columns = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME
        };
        try (Cursor cursor = resolver.query(children, columns, null, null, null)) {
            while (cursor != null && cursor.moveToNext()) {
                if (name.equals(cursor.getString(1))) {
                    return DocumentsContract.buildDocumentUriUsingTree(tree, cursor.getString(0));
                }
            }
        }
        return null;
    }

    private String folderName(Uri tree) {
        Uri document = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
        String[] columns = { DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor cursor = getContext().getContentResolver().query(document, columns, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null) {
                    return name;
                }
            }
        } catch (Exception ignored) {
            // Fall through to the generic name.
        }
        return "Backup folder";
    }
}
