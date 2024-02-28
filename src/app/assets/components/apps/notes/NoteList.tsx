import React, { useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Scrollbar from "../../custom-scroll/Scrollbar";

import { IconTrash } from "@tabler/icons-react";
import { NotesType } from "../../../types/apps/notes";

const NoteList = () => {
  const activeNote = 1;
  const searchTerm = "";

  const filterNotes = (notes: NotesType[], nSearch: string) => {
    if (nSearch !== "")
      return notes.filter(
        (t: any) =>
          !t.deleted &&
          t.title
            .toLocaleLowerCase()
            .concat(" ")
            .includes(nSearch.toLocaleLowerCase())
      );

    return notes.filter((t) => !t.deleted);
  };

  const notes = {} as NotesType[];

  return (
    <>
      <Box p={3} px={2}>
        <TextField
          id="search"
          value={searchTerm}
          placeholder="Search Notes"
          inputProps={{ "aria-label": "Search Notes" }}
          size="small"
          type="search"
          variant="outlined"
          fullWidth
          onChange={(e) => {}}
        />
        <Typography variant="h6" mb={0} mt={4} pl={1}>
          All Notes
        </Typography>
      </Box>
      <Box>
        <Scrollbar
          sx={{
            height: { lg: "calc(100vh - 300px)", sm: "100vh" },
            maxHeight: "700px",
          }}
        >
          {notes && notes.length ? (
            notes.map((note) => (
              <Box key={note.id} px={2}>
                <Box
                  p={2}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    mb: 1,
                    transition: "0.1s ease-in",
                    transform:
                      activeNote === note.id ? "scale(1)" : "scale(0.95)",
                    backgroundColor: `${note.color}.light`,
                  }}
                  onClick={() => {}}
                >
                  <Typography variant="h6" noWrap color={note.color + ".main"}>
                    {note.title}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="caption">
                      {new Date(note.datef).toLocaleDateString()}
                    </Typography>
                    <Tooltip title="Delete">
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => {}}
                      >
                        <IconTrash width={18} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>
            ))
          ) : (
            <Box m={2}>
              <Alert severity="error" variant="filled" sx={{ color: "white" }}>
                No Notes Found!
              </Alert>
            </Box>
          )}
        </Scrollbar>
      </Box>
    </>
  );
};

export default NoteList;
