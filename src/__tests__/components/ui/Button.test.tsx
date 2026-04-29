import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>إنشاء مشروع</Button>);
    expect(screen.getByRole("button", { name: "إنشاء مشروع" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>إنشاء</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>إنشاء</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>إنشاء</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">إلغاء</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-gray-200");
  });
});
