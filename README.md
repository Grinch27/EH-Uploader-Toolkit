# EH-Uploader-Toolkit
Some javascript toolkits that help uploaders manage Gallery more easily

Managegallery Smart Sort (filename with number{series_, index_}).
Good for filename such as 114_1.jpg, the first shown number would be the series_, then the second one be the index_.
Sort by [-series_, index_], means that the max series_ shows first, and the min index_ follows.

for example:
filename shown in Managegallery Page:
A001_B002.jpg, C001_D000.png, E002_F001.gif, G001_H001.jpg

will be sorted to:
E002_F001.gif
C001_D000.png
G001_H001.jpg
A001_B002.jpg

But I didn't test what will happen if more than 2 files with same series_ and index_,
Anyway, it works well in img sort, especially for those files like Pixix/Fanbox/Fantia set, because they usually have filename like (series_number)_p(index_number).

I hope this tool can help EH uploaders, for it does save a lot of time from sorting plenty of imgs.

Welcome for any Issues!
