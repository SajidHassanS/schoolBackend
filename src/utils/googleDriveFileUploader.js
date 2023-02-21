const fs = require("fs");
const { google } = require("googleapis");
const catchAsync = require("./catchAsync");
const googleFolderKey = process.env.GOOGLE_DRIVE_FOLDER_KEY;

const uploadFile = async function uploadFile(file) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./src/utils/googleKey/googleKey.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const driveService = google.drive({
      version: "v3",
      auth,
    });
    const fileMetaData = {
      name: "file",
      parents: [googleFolderKey],
    };

    const media = {
      mimeType: "image/jpg",
      mimeType: "image/pdf",
      mimeType: "image/docx",
      body: fs.createReadStream(file),
    };

    const response = await driveService.files.create({
      resource: fileMetaData,
      media: media,
    });
    const fileId = response.data.id;
    let link = `https://drive.google.com/uc?export=view&id=${fileId}`;
    let value = {
      url: link,
      fileId: fileId,
    };
    console.log("Uploaded file link: " + value);
    return value;
  } catch (err) {
    console.log("Upload file error", err);
  }
};

const deleteFile = catchAsync(async (req, res) => {
  const data = req.body;
  let fileId = data.fileDetail.id;
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./src/utils/googleKey/googleKey.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const driveService = google.drive({
      version: "v3",
      auth,
    });
    driveService.files
      .delete({
        fileId: fileId,
      })
      .then(
        async function (response) {
          console.log("file deleted having id: " + fileId),
            res.status(204).json({ status: "success" });
        },
        function (err) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Deletion Failed for some reason" }] });
        }
      );
  } catch (e) {}
});

const deleteFileFromDrive = (id) => {
  let deleteFileId = id;
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./src/utils/googleKey/googleKey.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const driveService = google.drive({
      version: "v3",
      auth,
    });
    driveService.files
      .delete({
        fileId: deleteFileId,
      })
      .then(
        async function (response) {
          console.log("file deleted having id: " + deleteFileId);
        },
        function (err) {
          console.log(err);
        }
      );
  } catch (e) {}
};
// uploadFile("./file.jpg");
module.exports = {
  uploadFile,
  deleteFile,
  deleteFileFromDrive,
};
