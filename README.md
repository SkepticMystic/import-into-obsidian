# Import into Obsidian Plugin

This plugin allows you to import the data from a csv file into Obsidian.

I'll use this csv file as an example:

```csv
file, string, stringArr, number, numberArr,  date, link, nested.field
existing, abc, "a, b, c", 123, "1, 2, 3", 2022-01-07, [[Untitled]], 1
non-existing, abc, "a, b, c", 123, "1, 2, 3", 2022-01-07, [[Untitled]], 1
2022-01-07, abc, "a, b, c", 123, "1, 2, 3", 2022-01-07, [[Untitled]], 1
```

## Note Types

When importing the data, the plugin tries to associate the value in the `file` column with a note in your vault.

If it can't find an exact match, it tries to find a corresponding daily note.

If no daily note is found, a new note will be created for that row.

## Import Data Command

When running the command to `Import Data`, you'll first be asked to choose a csv file.
Once a file is chosen, you'll see a modal appear, showing you a breakdown of which rows were associated with which file types.

![](https://imgur.com/jYIcHbf.png)

You can toggle which files get added by checking the box to the left of the file name.

Click `Import Selected Files`, and the command will run.

You'll see two things in this picture:

1. The data was correctly imported into the note `existing`.
2. A new note was created for `non-existing`.

![](https://imgur.com/HqHI4Tm.png)
