import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import EmailListItem from "./EmailListItem";

import Scrollbar from "../../custom-scroll/Scrollbar";
import { EmailType } from "../../../types/apps/email";

interface Props {
  showrightSidebar: any;
}

const EmailList = ({ showrightSidebar }: Props) => {
  const getVisibleEmail = (
    emails: EmailType[],
    filter: string,
    emailSearch: string
  ) => {
    switch (filter) {
      case "inbox":
        return emails.filter(
          (t) =>
            t.inbox &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "sent":
        return emails.filter(
          (t) =>
            t.sent &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "draft":
        return emails.filter(
          (t) =>
            t.draft &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "spam":
        return emails.filter(
          (t) =>
            t.spam &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "trash":
        return emails.filter(
          (t) => t.trash && t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "starred":
        return emails.filter(
          (t) =>
            t.starred &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "important":
        return emails.filter(
          (t) =>
            t.important &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "Promotional":
        return emails.filter(
          (t) =>
            t.label === "Promotional" &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "Social":
        return emails.filter(
          (t) =>
            t.label === "Social" &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      case "Health":
        return emails.filter(
          (t) =>
            t.label === "Health" &&
            !t.trash &&
            t.from.toLocaleLowerCase().includes(emailSearch)
        );
      default:
        throw new Error(`Unknown filter: ${filter}`);
    }
  };

  const emails = [] as EmailType[];

  const active = 1;

  return (
    <List>
      <Scrollbar
        sx={{
          height: { lg: "calc(100vh - 100px)", md: "100vh" },
          maxHeight: "800px",
        }}
      >
        {/* ------------------------------------------- */}
        {/* Email page */}
        {/* ------------------------------------------- */}
        {emails.map((email) => (
          <EmailListItem
            key={email.id}
            {...email}
            onClick={() => {
              showrightSidebar();
            }}
            onDelete={() => {}}
            isSelected={email.id === active}
            onStar={() => {}}
            onImportant={() => {}}
            onChange={(e) => {}}
          />
        ))}
      </Scrollbar>
    </List>
  );
};

export default EmailList;
