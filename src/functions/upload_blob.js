import { app } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import multer from "multer";

app.http('upload_blob', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload',
    handler: async (request, context) => {
      const processFileUpload = new Promise((resolve, reject) => {
        multer().single("file")(request, context, async (error) => {
          if (error) {
            reject(error);
            return;
          }
          const formData = await request.formData();
          const uploaded_file = formData.get("fileContent");

          if (!uploaded_file) {
            reject(new Error("No file provided"));
            return;
          }

          const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AzureWebJobsStorage
          );
          const containerClient = blobServiceClient.getContainerClient(
            process.env.CONTAINER_NAME
          );
          const blockBlobClient = containerClient.getBlockBlobClient(
            uploaded_file.name
          );

          try {
            const buffer = await uploaded_file.arrayBuffer();

            await blockBlobClient.uploadData(buffer);

            context.res = {
              status: 200,
              body: `File '${fileName}' uploaded successfully to container '${process.env.CONTAINER_NAME}'`,
            };
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      try {
        await processFileUpload;
      } catch (error) {
        context.res = {
          status: 500,
          body: `Error processing file upload: ${error.message}`,
        };
      }
    }
});
