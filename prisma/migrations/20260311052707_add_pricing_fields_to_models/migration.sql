-- AlterTable
ALTER TABLE "models" ADD COLUMN     "image_price" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "input_cache_read_price" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "input_cache_write_price" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "internal_reasoning_price" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "request_price" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "web_search_price" TEXT NOT NULL DEFAULT '0';
