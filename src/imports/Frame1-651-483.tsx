import svgPaths from "./svg-g4pwm1z2ml";
import imgLogo from "figma:asset/aa0a1b54023d9dcbdd0ce08559fa625f40ab5e35.png";

function Logo() {
  return (
    <div className="absolute left-[454px] size-[192px] top-[112px]" data-name="Logo">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgLogo} />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[32px] left-0 not-italic text-[#101828] text-[24px] text-nowrap top-0 tracking-[0.0703px] whitespace-pre">Anmelden</p>
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex gap-[8px] h-[14px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[14px] not-italic relative shrink-0 text-[14px] text-neutral-950 text-nowrap tracking-[-0.1504px] whitespace-pre">E-Mail-Adresse</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">max.mustermann@hrthis.de</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[54px] items-start relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel />
      <Input />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="h-[14px] relative shrink-0 w-[60.57px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[14px] items-center relative w-[60.57px]">
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[14px] not-italic relative shrink-0 text-[14px] text-neutral-950 text-nowrap tracking-[-0.1504px] whitespace-pre">Passwort</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="h-[16px] relative shrink-0 w-[121.945px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[16px] relative w-[121.945px]">
        <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[16px] left-0 not-italic text-[#155dfc] text-[12px] text-nowrap top-px whitespace-pre">Passwort vergessen?</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel1 />
      <Button />
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[36px] items-center px-[12px] py-[4px] relative w-full">
          <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">••••••••</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[56px] items-start relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Input1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#155dfc] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[20px] left-[158.75px] not-italic text-[14px] text-nowrap text-white top-[8.5px] tracking-[-0.1504px] whitespace-pre">Anmelden</p>
    </div>
  );
}

function Form() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] h-[178px] items-start relative shrink-0 w-full" data-name="Form">
      <Container />
      <Container2 />
      <Button1 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[191.82px] not-italic text-[#4a5565] text-[14px] text-center text-nowrap top-[0.5px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">Noch kein Account?</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[119.37px] size-[16px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p32887f80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3694d280} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M12.6667 5.33333V9.33333" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M14.6667 7.33333H10.6667" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#00a63e] h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <Icon />
      <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[20px] left-[151.37px] not-italic text-[14px] text-nowrap text-white top-[8.5px] tracking-[-0.1504px] whitespace-pre">Jetzt registrieren</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[16px] left-[192.05px] not-italic text-[#6a7282] text-[12px] text-center text-nowrap top-px translate-x-[-50%] whitespace-pre">Kostenlos in 30 Sekunden erstellt!</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[12px] h-[117px] items-start pb-0 pt-[25px] px-0 relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1px_0px_0px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <Paragraph />
      <Button2 />
      <Paragraph1 />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col gap-[24px] h-[439px] items-start left-[339.5px] pb-0 pt-[32px] px-[32px] rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] top-[256.5px] w-[448px]" data-name="Container">
      <Heading />
      <Form />
      <Container3 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[20px] left-[339.5px] top-[719.5px] w-[448px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[223.87px] not-italic text-[#4a5565] text-[14px] text-center text-nowrap top-[0.5px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">© 2025 Browo Koordinator - Alle Rechte vorbehalten</p>
    </div>
  );
}

function Login() {
  return (
    <div className="absolute bg-white h-[796px] left-0 top-0 w-[1127px]" data-name="Login">
      <Logo />
      <Container4 />
      <Paragraph2 />
    </div>
  );
}

function BrowoKoordinator() {
  return (
    <div className="absolute bg-white h-[796px] left-[406px] top-[518px] w-[1127px]" data-name="Browo Koordinator">
      <Login />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <BrowoKoordinator />
    </div>
  );
}