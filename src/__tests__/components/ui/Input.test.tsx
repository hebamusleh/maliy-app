import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "@/components/ui/Input";

describe("Input", () => {
  it("renders with a label", () => {
    render(<Input label="اسم المشروع" />);
    expect(screen.getByLabelText("اسم المشروع")).toBeInTheDocument();
  });

  it("associates label with input via htmlFor", () => {
    render(<Input label="اسم المشروع" id="project-name" />);
    const input = screen.getByLabelText("اسم المشروع");
    expect(input).toHaveAttribute("id", "project-name");
  });

  it("displays an error message and sets aria-invalid", () => {
    render(<Input label="اسم المشروع" error="الاسم مطلوب" />);
    expect(screen.getByText("الاسم مطلوب")).toBeInTheDocument();
    const input = screen.getByLabelText("اسم المشروع");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("links error to input via aria-describedby", () => {
    render(<Input label="اسم المشروع" error="الاسم مطلوب" id="name" />);
    const input = screen.getByLabelText("اسم المشروع");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("الاسم مطلوب");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input label="اسم المشروع" />);
    const input = screen.getByLabelText("اسم المشروع");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("accepts user input", async () => {
    render(<Input label="اسم المشروع" />);
    const input = screen.getByLabelText("اسم المشروع");
    await userEvent.type(input, "مشروع تجاري");
    expect(input).toHaveValue("مشروع تجاري");
  });
});
